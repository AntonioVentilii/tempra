import type { CapacitorConfig } from '@capacitor/cli';

// Same static export as the website, wrapped for Android and iOS. The app id
// can still change until the first store submission; after that it is fixed.
const config: CapacitorConfig = {
	appId: 'dev.ventilii.tempra',
	appName: 'Tempra',
	webDir: 'build',
	backgroundColor: '#121417',
	android: {
		allowMixedContent: false
	},
	ios: {
		contentInset: 'automatic'
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
			backgroundColor: '#121417'
		},
		StatusBar: {
			style: 'DARK',
			backgroundColor: '#121417'
		}
	}
};

export default config;
