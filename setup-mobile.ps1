$ErrorActionPreference = 'Stop'
$mobilePath = Join-Path $PSScriptRoot 'mobile'

function Invoke-Npx {
    & npx.cmd @args
    if ($LASTEXITCODE -ne 0) {
        throw "npx failed with exit code $LASTEXITCODE."
    }
}

Push-Location $PSScriptRoot
try {
    if (!(Test-Path (Join-Path $mobilePath 'package.json'))) {
        Invoke-Npx --yes create-expo-app@latest mobile --template blank-typescript@sdk-56 --no-install
    }

    Push-Location $mobilePath
    try {
        if (Test-Path 'package-lock.json') {
            & npm.cmd ci
        } else {
            & npm.cmd install
        }
        if ($LASTEXITCODE -ne 0) {
            throw "npm failed with exit code $LASTEXITCODE."
        }

        Invoke-Npx expo install expo-dev-client expo-sqlite '@maplibre/maplibre-react-native@^11.0.0'

        $config = Get-Content -Raw app.json | ConvertFrom-Json
        $config.expo.name = 'Reflo'
        $config.expo.slug = 'reflo'
        $config.expo.android | Add-Member -NotePropertyName package -NotePropertyValue 'nl.reflo.app' -Force
        $plugins = @($config.expo.plugins | Where-Object { $_ })
        if ($plugins -notcontains '@maplibre/maplibre-react-native') {
            $plugins += '@maplibre/maplibre-react-native'
        }
        $config.expo | Add-Member -NotePropertyName plugins -NotePropertyValue $plugins -Force
        $config | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8NoBOM app.json

        if (!(Test-Path eas.json)) {
            Copy-Item (Join-Path $PSScriptRoot 'eas.android.json') eas.json
        }
        Invoke-Npx expo install --check
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}
