import { App } from "@openfin/workspace-platform/client-api-platform/src/shapes"

interface HomeProvider {
    id: string,
    title: string,
    icon: string,
    hidden?: boolean,
    queryMinLength?: number,
    queryAgainst?: string[],
}

interface AppProvider {
    appsSourceUrl: string,
    apps: App[],
    includeCredentialOnSourceRequest?: "omit" | "same-origin" | "include"
}
export interface CustomSettings {
    appProvider?: AppProvider,
    homeProvider?: HomeProvider
}