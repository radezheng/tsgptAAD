param(
    [string]$RESOURCE_GROUP_NAME,
    [string]$LOCATION,
    [string]$SVC_NAME,
    [string]$API_ID,
    [string]$AOAI_DEPLOYMENT_ID,
    [string]$AOAI_MODEL_ID,
    [string]$AOAI_KEY,
    [string]$APIM_PUBLISHER_EMAIL,
    [string]$PUBLISHER,
    [string]$curPath
)


Set-Location -Path $curPath
# 创建APIM
Write-Host "Creating APIM..." + $SVC_NAME
az apim create --name $SVC_NAME --resource-group $RESOURCE_GROUP_NAME --location $LOCATION --sku-name Developer --publisher-email $APIM_PUBLISHER_EMAIL --publisher-name $PUBLISHER

#wait for APIM created
Write-Host "Waiting for APIM created..."
# Wait for APIM to be created
do {
    $apimStatus = az apim show --name $SVC_NAME --resource-group $RESOURCE_GROUP_NAME --query provisioningState -o tsv
    Write-Host "APIM status: $apimStatus"
    Start-Sleep -s 30
} until ($apimStatus -eq "Succeeded")

Write-Host "Creating APIM API..." + $API_ID " " $PWD
az apim api import --resource-group $RESOURCE_GROUP_NAME --service-name $SVC_NAME  --api-id $API_ID --specification-format "OpenApi" --specification-path "../apim/apim_aoai.json" --display-name "AzureChatGPT" --path "/"  --service-url  "https://$AOAI_DEPLOYMENT_ID.openai.azure.com/openai/deployments/${AOAI_MODEL_ID}/"

Write-Host "Creating APIM Product..."
az apim nv create --service-name $SVC_NAME -g $RESOURCE_GROUP_NAME --named-value-id AOAI-KEY --display-name 'AOAI-Key' --value $AOAI_KEY --secret true

az apim product api add --resource-group $RESOURCE_GROUP_NAME --service-name $SVC_NAME --product-id starter --api-id $API_ID
az apim product api add --resource-group $RESOURCE_GROUP_NAME --service-name $SVC_NAME --product-id unlimited --api-id $API_ID

