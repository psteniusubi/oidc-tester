$empty = "{}"
$claims = @{ "test" = "€uro" } | ConvertTo-Json -Compress

$ec = Get-Content "ec.keypair.jwk" 
$rsa = Get-Content "rsa.keypair.jwk" 
$ec_negat = New-Jwk -KeyType "EC"
$rsa_negat = New-Jwk -KeyType "RSA"

$jwks = $ec, $rsa | ConvertTo-Jwks 

"// automatically generated" | Out-String

"export const jwks = $jwks;" | Out-String

$list = @()

foreach($alg in "RS256","RS384","RS512") {
    $a = $alg.ToLowerInvariant()
    $jwt = ConvertTo-Jwt -Body $empty -Alg $alg -Jwk $rsa
    "export const jwt_$($a)_empty = `"$jwt`";" | Out-String
    $jwt = ConvertTo-Jwt -Body $claims -Alg $alg -Jwk $rsa
    "export const jwt_$($a) = `"$jwt`";" | Out-String
    $list += "jwt_$($a)_empty"
    $list += "jwt_$($a)"
}
foreach($alg in "ES256","ES384","ES512") {
    $a = $alg.ToLowerInvariant()
    $jwt = ConvertTo-Jwt -Body $empty -Alg $alg -Jwk $ec
    "export const jwt_$($a)_empty = `"$jwt`";" | Out-String
    $jwt = ConvertTo-Jwt -Body $claims -Alg $alg -Jwk $ec
    "export const jwt_$($a) = `"$jwt`";" | Out-String
    $list += "jwt_$($a)_empty"
    $list += "jwt_$($a)"
}

"export const jwt_all = [ $( $list -join ", " ) ];" | Out-String

foreach($alg in "RS256") {
    $a = $alg.ToLowerInvariant()
    $jwt = ConvertTo-Jwt -Body $claims -Alg $alg -Jwk $rsa_negat
    "export const jwt_$($a)_negat = `"$jwt`";" | Out-String
}
foreach($alg in "ES256") {
    $a = $alg.ToLowerInvariant()
    $jwt = ConvertTo-Jwt -Body $claims -Alg $alg -Jwk $ec_negat
    "export const jwt_$($a)_negat = `"$jwt`";" | Out-String
}

"export const jwt_negat = [ jwt_rs256_negat, jwt_es256_negat ];" | Out-String
