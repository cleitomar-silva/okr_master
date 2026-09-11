<?php
//Conexão com o banco e chamada de funções
require "inc/conecta.php";
require "inc/funcoes.php";

//começa sessão
session_start();


date_default_timezone_set("America/Fortaleza");

function base64UrlDecode($data) {
    // Adiciona padding se necessário
    $padding = strlen($data) % 4;
    if ($padding > 0) {
        $data .= str_repeat('=', 4 - $padding);
    }
    // Substitui caracteres Base64Url por Base64
    $data = str_replace(['-', '_'], ['+', '/'], $data);
    return base64_decode($data);
}

function decodeJwt($jwt) {
    // Divide o JWT em partes: header, payload e signature
    list($header, $payload, $signature) = explode('.', $jwt);

    // Decodifica o header e o payload
    $decodedHeader = base64UrlDecode($header);
    $decodedPayload = base64UrlDecode($payload);

    // Converte JSON para array PHP
    $headerArray = json_decode($decodedHeader, true);
    $payloadArray = json_decode($decodedPayload, true);

    // Verifica se a decodificação foi bem-sucedida
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Erro ao decodificar JSON: ' . json_last_error_msg());
    }

    return [
        'header' => $headerArray,
        'payload' => $payloadArray,
        'signature' => $signature // A signature geralmente não é decodificada em JSON, pois é usada para verificação
    ];
}

$code = $_POST['code'];



$client_id = '9316df00-82e7-4ad1-9fa5-6702672e3d48';
// $client_secret = 'nRJ8Q~ympRRGU8bhJIL4G3qknfFzeYZQjywoOdAt';
$client_secret = 'nem8Q~E5vLmHEIRpvYXt4v8n1QTPOHyVFJSgXaQP';
$redirect_uri = 'https://protocolo.cafazonline.org.br/'; // Seu redirect_uri
$tenant = '37e93124-88f9-4b57-88a3-6c1c6ee9d5ec'; // O Tenant ID
$scope ='https://graph.microsoft.com/.default';

$token_url = "https://login.microsoftonline.com/$tenant/oauth2/v2.0/token";



/*
$data = [
    'client_id' => urlencode($client_id),
    'scope' => urlencode('https://graph.microsoft.com/.default'),
    'code' => urlencode($code),
    'redirect_uri' => urlencode($redirect_uri),
    'grant_type' => urlencode('authorization_code'),
    'client_secret' => urlencode($client_secret)
];

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data),
    ]
];

$context  = stream_context_create($options);
$response = file_get_contents($token_url, false, $context);
$tokens = json_decode($response, true);
*/

/*

$data = [
    'client_id' => $client_id,
    'scope' => $scope,
    'client_secret' => $client_secret, // Substitua pelo seu client_secret
    'grant_type' => 'client_credentials',
];

// Cria a string de dados URL-encoded
$data_string = http_build_query($data);


$options = [
    'http' => [
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => $data_string,
    ],
];

$context  = stream_context_create($options);
$response = file_get_contents($token_url, false, $context);

$responseArray = json_decode($response, true);

if (isset($responseArray['access_token'])) {
    $accessToken = $responseArray['access_token'];

    */



$data = [
    'client_id' => $client_id,
    'scope' => $scope,
    'code' => $code,
    'redirect_uri' => $redirect_uri,
    'grant_type' => 'authorization_code',
    'client_secret' => $client_secret
];


$contextData = http_build_query($data);


$contextOptions = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
            "Content-Length: " . strlen($contextData) . "\r\n", // Adiciona o comprimento do conteúdo
        'content' => $contextData
    ]
];



$context = stream_context_create($contextOptions);

$response = file_get_contents($token_url, false, $context);

$tokens = json_decode($response, true);

$redirect = "";

if(isset($tokens['access_token']) && !empty($tokens['access_token']))
{
    $decodedJwt  =  decodeJwt($tokens['access_token']);

    // echo  $decodedJwt['payload']['unique_name'];
    // echo  $decodedJwt['payload']['name'];

    $sql = "SELECT id, nome, login, senha, admin, email, setor, status, setores_pagina_inicial, status FROM usuario WHERE email = '".trim($decodedJwt['payload']['unique_name'])."' ";

    $result = mysqli_query( $conexao, $sql ) or die("Não foi possível conectar-se ao Banco de dados.");
    $resultado = mysqli_fetch_array($result);

    $param = "";
    if(isset($resultado['id']) && !empty($resultado['id']) )
    {

        if(!isset($resultado['status']) || empty($resultado['status']) )
        {
            echo json_encode(["redirect"=>"bloqueado"]);
            die();
        }
       
        if($resultado['senha'] == null)
        {
            $param = ", senha = '".password_hash('Cfz@2024-mestre', PASSWORD_DEFAULT)."' ";
        }

        $updateSql = "UPDATE usuario SET updated_at = '".date("Y-m-d H:i:s")."' ". $param ." WHERE id = ".$resultado['id'];
        mysqli_query( $conexao, $updateSql ) or die("Não foi possível conectar-se ao Banco de dados.");
        mysqli_close($conexao);



        $_SESSION['logadoProto'] = true;
        $_SESSION['nomeusuProto'] = $resultado['nome'];
        $_SESSION['loginusuProto'] = $resultado['login'];
        $_SESSION['codusuProto'] = $resultado['id'];
        $_SESSION['adminusuProto'] = $resultado['admin'];
        $_SESSION['emailusuProto'] = $resultado['email'];
        $_SESSION['setorusuProto'] = $resultado['setor'];
        $_SESSION['arSetorusuProto'] = explode(',',$_SESSION['setorusuProto']);
        $_SESSION['sizeArSetorusuProto'] = sizeof($_SESSION['arSetorusuProto']);
        $_SESSION['setoresPaginaInicial'] = $resultado['setores_pagina_inicial'];


        //tabela tipo_chamado
        $_SESSION['id_atendimento_presencial'] = 2; //Atendimento presencial
        $_SESSION['id_atendimento_telefonico'] = 3; //Atendimento telefônico
        $_SESSION['id_atendimento_email'] = 4; //Atendimento e-mail
        $_SESSION['id_atendimento_teams'] = 5; //Atendimento teams
        $_SESSION['id_atendimento_whatsapp'] = 6; //Atendimento whataspp
        $_SESSION['id_registro_atividade_interna'] = 232; //Registro de atividade interna
        $_SESSION['id_processos_internos'] = 261;  // Processos Internos

        if(isset($_SESSION['urlexterno']))
        {
            $redirect = str_replace("/protocolo/","/",$_SESSION['urlexterno']);
        }
        else
        {
            $redirect = "principal.php";
        }


    }
    

}


echo json_encode(["redirect"=>$redirect]);





