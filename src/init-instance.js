import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';

// Check for instance name from env var or CLI args: --instance=branch2
const instanceArg = process.argv.find(arg => arg.startsWith('--instance='));
const instanceName = process.env.APP_INSTANCE || (instanceArg ? instanceArg.split('=')[1] : null);

if (instanceName) {
    try {
        const defaultAppData = app.getPath('appData');
        const mainUserData = join(defaultAppData, 'Managely Cashier');
        const customUserData = join(defaultAppData, `Managely Cashier - ${instanceName}`);

        // Set custom userData path so NeDB and local configs are completely isolated
        app.setPath('userData', customUserData);

        if (!existsSync(customUserData)) {
            mkdirSync(customUserData, { recursive: true });
        }

        // Auto-copy license if it exists in main instance so testing is frictionless
        const mainLicense = join(mainUserData, 'license.json');
        const customLicense = join(customUserData, 'license.json');
        if (existsSync(mainLicense) && !existsSync(customLicense)) {
            try {
                copyFileSync(mainLicense, customLicense);
                console.log(`[Instance] Auto-copied license from main instance to ${instanceName}`);
            } catch (e) {
                console.error(`[Instance] Could not copy license:`, e);
            }
        }

        // Auto-copy network_config if it exists in main instance so cloud sync credentials are ready
        const mainNetConfig = join(mainUserData, 'network_config.json');
        const customNetConfig = join(customUserData, 'network_config.json');
        if (existsSync(mainNetConfig) && !existsSync(customNetConfig)) {
            try {
                copyFileSync(mainNetConfig, customNetConfig);
                console.log(`[Instance] Auto-copied cloud sync config from main instance to ${instanceName}`);
            } catch (e) {
                console.error(`[Instance] Could not copy network config:`, e);
            }
        }

        console.log(`[Instance] Running isolated instance: "${instanceName}" -> ${customUserData}`);
    } catch (err) {
        console.error(`[Instance] Error configuring instance path:`, err);
    }
}

export { instanceName };
