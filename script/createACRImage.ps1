param (
    [string]$ACR_NAME,
    [string]$DOCKER_IMAGE,
    [string]$RESOURCE_GROUP_NAME

)

#create acr
Write-Host "Creating Azure Container Registry..." + $ACR_NAME
az acr create --resource-group $RESOURCE_GROUP_NAME --name $ACR_NAME --sku Basic --admin-enabled true

#login acr
Write-Host "Login Azure Container Registry..." + $ACR_NAME
az acr login --name $ACR_NAME

#build image
Write-Host "Build image..." + $DOCKER_IMAGE
docker build -t $DOCKER_IMAGE ..

#push image
Write-Host "Push image..." + $DOCKER_IMAGE
docker push $DOCKER_IMAGE
