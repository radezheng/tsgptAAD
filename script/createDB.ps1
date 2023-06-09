param(
        [string]$SQL_SERVER_NAME,
        [string]$RESOURCE_GROUP_NAME,
        [string]$LOCATION,
        [string]$ADMIN_USERNAME,
        [string]$ADMIN_PASSWORD,
        [string]$DB_NAME
)

# create sql server
Write-Host "Creating Azure SQL Server..." + $SQL_SERVER_NAME
az sql server create --name $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP_NAME `
        --location $LOCATION --admin-user $ADMIN_USERNAME --admin-password $ADMIN_PASSWORD

# set firewall rule to allow current client public ip
$ip = Invoke-RestMethod -Uri "https://api.ipify.org?format=json" | Select-Object -ExpandProperty ip
az sql server firewall-rule create --name "AllowClients" --server $SQL_SERVER_NAME `
    --resource-group $RESOURCE_GROUP_NAME --start-ip-address $ip --end-ip-address $ip

#set firewall rule to allow azure services
az sql server firewall-rule create --resource-group $RESOURCE_GROUP_NAME --server $SQL_SERVER_NAME  `
    --name AllowAllWindowsAzureIps --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0


# create database
Write-Host "Creating  Azure SQL DB..." + $DB_NAME
az sql db create --name $DB_NAME --server $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP_NAME `
    --edition "GeneralPurpose" --family "Gen5" --capacity 2 `
    --compute-model "Provisioned" --license-type BasePrice --max-size 32GB --zone-redundant false `
    --backup-storage-redundancy Local --collation "Latin1_General_100_BIN2_UTF8"
