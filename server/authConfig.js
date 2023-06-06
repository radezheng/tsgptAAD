const authConfig = {
    credentials: {
        tenantID: "Enter_the_Tenant_Info_Here",
        clientID: "Enter_the_Application_Id_Here"
    },
    metadata: {
        authority: "login.microsoftonline.com",
        discovery: ".well-known/openid-configuration",
        version: "v2.0"
    },
    settings: {
        validateIssuer: true,
        passReqToCallback: true,
        loggingLevel: "info",
        loggingNoPII: true,
    },
    protectedRoutes: {
        chat: {
            endpoint: "/api/chat",
            delegatedPermissions: {
                read: ["chat.Read", "chat.ReadWrite"],
                write: ["chat.ReadWrite"]
            },
            applicationPermissions: {
                read: ["chat.Read.All", "chat.ReadWrite.All"],
                write: ["chat.ReadWrite.All"]
            }
        }
    }
}

export { authConfig };