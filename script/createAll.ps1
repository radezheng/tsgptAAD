


$RESOURCE_GROUP_NAME="rgOpenAIChat"
$LOCATION="eastasia"

#for AAD
$Tenant_Id = "<your tenant id>"

#for DB
#需全球唯一
$SQL_SERVER_NAME="<your unique sql server name>"
$ADMIN_USERNAME="<your admin username>"
$ADMIN_PASSWORD=Read-Host "Enter the admin password"
$DB_NAME="dbGPT"

#for APIM
#需全球唯一
$SVC_NAME="<your unique apim name>"
$API_ID="azuregpt-api"
$AOAI_DEPLOYMENT_ID="<your deployment id>"
$AOAI_MODEL_ID="<your model id>"
$AOAI_KEY=$AOAI_KEY = Read-Host "Enter the Azure OpenAI key"
#服务创建完成会发邮件通知
$APIM_PUBLISHER_EMAIL="<your email>"
$PUBLISHER="<your publisher name>"

#for webapp
$VUE_APP_APIM_HOST=$SVC_NAME + ".azure-api.net"
#等待API服务创建完成手动在Portal填写
$VUE_APP_APIM_KEY="xxx"
#需全球唯一, 可改为自己容易记的名字。bot访问的地址为 https://<your app name>.azurewebsites.net
$APP_NAME="chat$(Get-Date -Format 'MMddHHmmss')"
#需全球唯一
$ACR_NAME="<your acr name>"
#改为自己的镜像地址, 会包含你定义的AAD tenant信息
$DOCKER_IMAGE="$ACR_NAME.azurecr.io/<change to your own image, e.g. tsgptAAD:basic>"



# create resource group
Write-Host "Creating resource group..."
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

#call create apim, may need 20 to 30 minutes
Set-Location -Path $PWD
$job = Start-Job -FilePath "createAPIM.ps1" -ArgumentList $RESOURCE_GROUP_NAME, $LOCATION, $SVC_NAME, $API_ID, $AOAI_DEPLOYMENT_ID, $AOAI_MODEL_ID, $AOAI_KEY, $APIM_PUBLISHER_EMAIL, $PUBLISHER, $PWD

#build and push your own image
.\createACRImage.ps1 -DOCKER_IMAGE $DOCKER_IMAGE -ACR_NAME $ACR_NAME -RESOURCE_GROUP_NAME $RESOURCE_GROUP_NAME


#call .\ConfigureAAD.ps1 to configure AAD
.\ConfigureAAD.ps1 -TenantId $Tenant_Id


#call .\createDB.ps1 to create DB
.\createDB.ps1 -SQL_SERVER_NAME $SQL_SERVER_NAME -RESOURCE_GROUP_NAME $RESOURCE_GROUP_NAME -LOCATION $LOCATION -ADMIN_USERNAME $ADMIN_USERNAME -ADMIN_PASSWORD $ADMIN_PASSWORD -DB_NAME $DB_NAME

#call .\createWebApp.ps1 to create web app
.\createWebApp.ps1 -ADMIN_USERNAME $ADMIN_USERNAME -ADMIN_PASSWORD $ADMIN_PASSWORD -SQL_SERVER_NAME $SQL_SERVER_NAME -DB_NAME $DB_NAME -APP_NAME $APP_NAME -RESOURCE_GROUP_NAME $RESOURCE_GROUP_NAME -DOCKER_IMAGE $DOCKER_IMAGE -VUE_APP_APIM_HOST $VUE_APP_APIM_HOST -VUE_APP_APIM_KEY $VUE_APP_APIM_KEY -ACR_NAME $ACR_NAME


Write-Host "Waiting for apim job to finish...run this command to check the log:" `
 " Get-Job | Sort-Object -Property PSBeginTime -Descending | Select-Object -First 1 | Receive-Job"
Get-Job | Sort-Object -Property PSBeginTime -Descending | Select-Object -First 1 | Receive-Job

Write-Host "需要手动 更新 apim policy(./apim/policy.xml), 并获取 apim key 更新到 web app 的环境变量中"