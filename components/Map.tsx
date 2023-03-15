import {
	StyleSheet,
	View,
	Dimensions,
	Alert,
	Text,
	TouchableOpacity,
	Platform,
} from "react-native";
import MapView, { LatLng, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useEffect, useRef, useState } from "react";
import { getCurrentPositionAsync, useForegroundPermissions, PermissionStatus } from "expo-location";
import {
	GooglePlaceDetail,
	GooglePlacesAutocomplete,
} from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import MapViewDirections from "react-native-maps-directions";

import { GOOGLE_API_KEY } from "../environmentals";

type InputAutocompleteProps = {
	label: string;
	placeholder?: string;
	onPlaceSelected: (details: GooglePlaceDetail | null) => void;
};

function InputAutocomplete({ label, placeholder, onPlaceSelected }: InputAutocompleteProps) {
	return (
		<View style={styles.inputContainer}>
			<Text>{label}</Text>
			<GooglePlacesAutocomplete
				styles={{ textInput: styles.input }}
				placeholder={placeholder || ""}
				fetchDetails
				onPress={(data, details = null) => {
					onPlaceSelected(details);
				}}
				query={{
					key: GOOGLE_API_KEY,
					language: "en",
				}}
			/>
		</View>
	);
}

export default function Map() {
	const [origin, setOrigin] = useState<LatLng | null>();
	const [destination, setDestination] = useState<LatLng | null>();
	const [distance, setDistance] = useState(0);
	const [duration, setDuration] = useState(0);
	const mapRef = useRef<MapView>(null);
	const [alertDisplayed, setAlertDisplayed] = useState(false);
	const [curLoc, setCurLoc] = useState({ lat: NaN, lon: NaN });
	const [locationPermissionInformation, requestPermission] = useForegroundPermissions();
	const [showDirections, setShownDirections] = useState(false);

	const { width, height } = Dimensions.get("window");

	const ASPECT_RATIO = width / height;
	const LONGITUDE_DELTA = 0.02 * ASPECT_RATIO;
	const initialPosition: Region = {
		latitude: curLoc.lat || 52,
		longitude: curLoc.lon || 13,
		latitudeDelta: 0.02,
		longitudeDelta: LONGITUDE_DELTA,
	};

	useEffect(() => {
		async function verifyPermissions() {
			if (locationPermissionInformation?.status === PermissionStatus.UNDETERMINED) {
				const permissionResponse = await requestPermission();
				return permissionResponse.granted;
			}
			if (locationPermissionInformation?.status === PermissionStatus.DENIED && !alertDisplayed) {
				setAlertDisplayed(true);
				Alert.alert(
					"Insufficient Permissions!",
					"You need to grant location permissions to use the map"
				);
				return false;
			}
			return true;
		}
		async function getLocation() {
			try {
				const hasPermission = await verifyPermissions();
				if (!hasPermission) {
					setCurLoc({
						lat: 52,
						lon: 13,
					});
					return;
				}
				const location = await getCurrentPositionAsync();
				setCurLoc({
					lat: location.coords.latitude,
					lon: location.coords.longitude,
				});
			} catch (e) {}
		}
		getLocation();
	}, [locationPermissionInformation]);

	const moveTo = async (position: LatLng) => {
		const camera = await mapRef.current?.getCamera();
		if (camera) {
			camera.center = position;
			mapRef.current?.animateCamera(camera, { duration: 1000 });
		}
	};

	const edgePaddingValue = 17;

	const edgePadding = {
		top: edgePaddingValue,
		right: edgePaddingValue,
		bottom: edgePaddingValue,
		left: edgePaddingValue,
	};

	const traceRoute = () => {
		if (origin && destination) {
			setShownDirections(true);
			mapRef.current?.fitToCoordinates([origin, destination], { edgePadding });
		}
	};

	const traceRouteOnReady = (args: any) => {
		if (args) {
			setDistance(args.distance);
			setDuration(args.duration);
		}
	};

	const onPlaceSelected = (details: GooglePlaceDetail | null, flag: "origin" | "destination") => {
		const set = flag === "origin" ? setOrigin : setDestination;
		const position = {
			latitude: details?.geometry.location.lat || 52,
			longitude: details?.geometry.location.lng || 13,
		};
		set(position);
		moveTo(position);
	};
	return (
		<View style={styles.mapContainer}>
			<MapView
				ref={mapRef}
				style={styles.mapStyle}
				provider={PROVIDER_GOOGLE}
				region={initialPosition}
			>
				{origin && <Marker coordinate={origin} />}
				{destination && <Marker coordinate={destination} pinColor='#7ed5eb' />}
				{showDirections && origin && destination && (
					<MapViewDirections
						optimizeWaypoints
						origin={origin}
						destination={destination}
						apikey={GOOGLE_API_KEY}
						strokeColor={"red"}
						strokeWidth={4}
						onReady={traceRouteOnReady}
						onError={(e) => {
							Alert.alert("Sorry we can not find a route for these points");
						}}
					/>
				)}
			</MapView>
			<View style={styles.searchContainer}>
				<InputAutocomplete
					label='Origin'
					onPlaceSelected={(details) => {
						onPlaceSelected(details, "origin");
					}}
				/>
				<InputAutocomplete
					label='Destination'
					onPlaceSelected={(details) => {
						onPlaceSelected(details, "destination");
					}}
				/>
				{duration && distance ? (
					<View>
						<Text>Distance: {distance.toFixed(2)}</Text>
						<Text>Duration: {Math.ceil(duration)} min</Text>
					</View>
				) : null}
				<TouchableOpacity style={styles.buttonContainer} onPress={traceRoute}>
					<Text style={styles.buttonText}>Get Route</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	mapContainer: {
		flex: 3,
		backgroundColor: "blue",
	},
	mapStyle: {
		width: "100%",
		height: "100%",
	},
	searchContainer: {
		position: "absolute",
		width: "90%",
		backgroundColor: "white",
		shadowColor: "black",
		shadowOffset: { width: 2, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
		borderRadius: 8,
		alignSelf: "center",
		top: Platform.OS == "ios" ? Constants.statusBarHeight : 5,
	},
	inputContainer: {
		marginHorizontal: 8,
		marginBottom: 4,
	},
	input: {
		borderColor: "#888",
		borderWidth: 1,
	},
	buttonContainer: {
		backgroundColor: "#1a73e8",
		width: "100%",
		alignItems: "center",
		padding: 10,
		borderBottomEndRadius: 8,
		borderBottomStartRadius: 8,
	},
	buttonText: {
		color: "white",
		fontWeight: "bold",
	},
});
