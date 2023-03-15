import { StatusBar, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "./components/Map";

export default function App() {
	const colorTheme = useColorScheme();

	const backgroundColor = {
		backgroundColor: colorTheme === "dark" ? "#222121" : "white",
	};

	return (
		<>
			<SafeAreaView style={[styles.rootContainer]}>
				<StatusBar barStyle={"dark-content"} translucent backgroundColor='transparent' />
				<Map />
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	rootContainer: {
		flex: 1,
	},
});
