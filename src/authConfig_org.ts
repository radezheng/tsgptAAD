import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

// Config object to be passed to Msal on creation

export const msalConfig = {
  auth: {
    clientId: 'Enter_the_Application_Id_Here',
    authority: 'https://login.microsoftonline.com/Enter_the_Tenant_Info_Here',
    redirectUri: '/', // Must be registered as a SPA redirectURI on your app registration
    postLogoutRedirectUri: '/' // Must be registered as a SPA redirectURI on your app registration
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
      loggerOptions: {
          loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
              if (containsPii) {
                  return;
              }
              switch (level) {
                  case LogLevel.Error:
                      console.error(message);
                      return;
                  case LogLevel.Info:
                      console.info(message);
                      return;
                  case LogLevel.Verbose:
                      console.debug(message);
                      return;
                  case LogLevel.Warning:
                      console.warn(message);
                      return;
                  default:
                      return;
              }
          },
          logLevel: LogLevel.Verbose
      }
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const protectedResources = {
  apiChat: {
      endpoint: "http://localhost:3000/api",
      scopes: {
          read: [ "api://Enter_the_Web_Api_Application_Id_Here/chat.Read" ],
          write: [ "api://Enter_the_Web_Api_Application_Id_Here/chat.ReadWrite" ]
      }
  }
}

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: [...protectedResources.apiChat.scopes.read, ...protectedResources.apiChat.scopes.write],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};