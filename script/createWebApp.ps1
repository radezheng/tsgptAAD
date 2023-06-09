

param(
    [string]$ADMIN_USERNAME,
    [string]$ADMIN_PASSWORD,
    [string]$SQL_SERVER_NAME,
    [string]$DB_NAME,
    [string]$APP_NAME,
    [string]$RESOURCE_GROUP_NAME,
    [string]$DOCKER_IMAGE,
    [string]$VUE_APP_APIM_HOST,
    [string]$VUE_APP_APIM_KEY,
    [string]$ACR_NAME
)

$DB_USER=$ADMIN_USERNAME
$DB_PASSWORD=$ADMIN_PASSWORD
$DB_SERVER=$SQL_SERVER_NAME + ".database.windows.net"
$DB_DATABASE=$DB_NAME

Write-Host "Creating  Azure SQL Table and Data, need sqlcmd ..."
$sqlcmd = "sqlcmd -S $DB_SERVER -d $DB_NAME -U $ADMIN_USERNAME -P $ADMIN_PASSWORD -i .\table.sql"
Invoke-Expression $sqlcmd

# Create web app
Write-Host "Creating web app plan..." + $APP_NAME + "-plan"
az appservice plan create --name $APP_NAME'-plan' --resource-group $RESOURCE_GROUP_NAME --sku B3 --is-linux

Write-Host "Creating web app..." + $APP_NAME
az webapp create --resource-group $RESOURCE_GROUP_NAME --plan $APP_NAME'-plan'  --name $APP_NAME --deployment-container-image-name $DOCKER_IMAGE

#assign acr role to web app
Write-Host "Assign acr role to web app..."
$APP_PRINCIPLE=(az webapp identity assign --resource-group $RESOURCE_GROUP_NAME --name $APP_NAME --query principalId --output tsv)
$ACR_ID=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP_NAME --query id --output tsv)
az role assignment create --assignee $APP_PRINCIPLE --role Reader --scope $ACR_ID


Write-Host "deploy container to web app..." 
az webapp config container set --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME --docker-custom-image-name $DOCKER_IMAGE --docker-registry-server-url https://$ACR_NAME.azurecr.io

# Set environment variables
Write-Host "Setting environment variables..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP_NAME --name $APP_NAME --settings VUE_APP_APIM_HOST=$VUE_APP_APIM_HOST VUE_APP_APIM_KEY=$VUE_APP_APIM_KEY DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_SERVER=$DB_SERVER DB_DATABASE=$DB_DATABASE NODE_PORT=3000

# Restart web app
Write-Host "Restarting web app..."
az webapp restart --resource-group $RESOURCE_GROUP_NAME --name $APP_NAME

#show web app url
Write-Host "Web app url:"
az webapp show --resource-group $RESOURCE_GROUP_NAME --name $APP_NAME --query defaultHostName --output tsv