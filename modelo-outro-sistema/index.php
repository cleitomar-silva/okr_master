<?
require "inc/conecta.php";
require "inc/funcoes.php";
?>
<!DOCTYPE html>
<html style="font-size: unset;">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>CAFAZ - Sistema de protocolo</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <!-- Bootstrap 3.3.5 -->
    <!--
    <link rel="stylesheet" href="plugins/bootstrap/css/bootstrap.min.css"> -->
 <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">



    <!-- Font Awesome -->
    <link rel="stylesheet" href="plugins/font-awesome-4.5.0/css/font-awesome.min.css">
    <!-- Ionicons -->
    <link rel="stylesheet" href="plugins/ionicons-master/css/ionicons.min.css">
    <!-- Theme style -->
    <link rel="stylesheet" href="dist/css/AdminLTE.min.css">
    <!-- iCheck -->
    <link rel="stylesheet" href="plugins/iCheck/square/blue.css">


    <!-- Bootstrap v5.3.3 -->
    <link rel="stylesheet" href="dist/css/bootstrap5/bootstrap.css">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


    <style>

        body {
            margin: 0;
            padding-bottom: 80px;
            box-sizing: border-box;
            display: flex;
            height: 100vh;


        }

        .footer {
            /*
            background-color: #10619C;
            color: white;
            text-align: center;
            padding: 10px 0;
            font-size: 14px;
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 80px;
            */

            background-color: #10619C;
            color: white;
            padding: 10px 20px;
            font-size: 14px;
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;


        }

        .footer .centralized-text {
            text-align: center;
        }

        .footer .right-text {
            position: absolute;
            right: 20px;
        }


        .footer p {
            margin: 0;
            line-height: 1.5;
        }

        .wallpapper-bg{
            background: #eff3f9;
           /* background-image: url(dist/img/cafaz-login.jpg); */
            background-repeat: round;
            background-size: cover;
            width: 100%;
            display: flex;
            justify-content: center;
            /* height: 100%;*/


            margin: 0;
            padding: 0;
            height: 100vh;
            align-items: center;
            background: linear-gradient(135deg, #ff0000 -73%, #3ab8c51c 16%, #0000ff 69%);
            background-size: 400% 400%;
            animation: gradientAnimation 10s ease infinite;


        }

        @media (max-width: 700px) {
            .centralized-text {
                display: none;
            }
        }

        #preloader{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            height: 100%;
            width: 100%;
            visibility: hidden;
            background: #ffffff82;
        }

        #statusPre{

            width: 900px;
            height: 600px;
            position: absolute;
            left: 50%;
            top: 50%;
            margin: -300px 0 0 -450px;
            background:url(dist/img/loading3.gif) center no-repeat;
            background-size: 90px;
        }

        .login-logo, .register-logo {
            font-size: 30px;
           
        }

         .auth-btn
        {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: inherit;
            font-style: normal;
            font-family: inherit;
            max-width: 100%;
            position: relative;
            text-align: center;
            text-decoration: none;
            transition: background 0.1s ease-out, box-shadow 0.15s cubic-bezier(0.47, 0.03, 0.49, 1.38);
            white-space: nowrap;
            cursor: pointer;
            /* padding: 0px 10px; */
            vertical-align: middle;
            width: 100%;
            box-shadow: none;
            font-weight: bold;
            border: 1px solid rgb(193, 199, 208);
            border-radius: 3px;
            color: #42526E !important;
            height: 40px !important;
            line-height: 40px !important;
            background: rgb(255, 255, 255) !important;
            padding: 1.5rem 1.25rem;
        }

        .auth-btn:hover{
            background: #f5f5f5 !important;
        }

    </style>


</head>
<body class="hold-transition login-page">
    <div id="preloader">
        <div id="statusPre"></div>
    </div>
    <div class="wallpapper-bg">
        <div class="login-box " style="z-index: 1">
           
            <div class="login-box-body" >
                 <div class="login-logo text-uppercase" style="color: black;font-weight: bold; ">
                    <b>Protocolo Digital</b>
                </div><!-- /.login-logo -->
                <p class="login-box-msg">Acesso ao sistema</p>
                <?
                if ( isset($_REQUEST['cod']) && !empty($_REQUEST['cod']) && $_REQUEST['cod'] == 1) {
                    ?>

                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>Dados informados não conferem!</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <?
                }
                ?>
                <?
                if (isset($_REQUEST['cod']) && !empty($_REQUEST['cod']) && $_REQUEST['cod'] == 2) {
                    ?>

                    <div class="alert alert-info alert-dismissible fade show" role="alert">
                        <strong>Preencha todos os campos!</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                    <?
                }
                ?>
                <?
                if (isset($_REQUEST['cod']) && !empty($_REQUEST['cod']) && $_REQUEST['cod'] == 3) {
                    ?>

                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>Usuário bloqueado!</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                    <?
                }
                ?>


                <div class="row " style="justify-content: center;margin-top: 5px">
                    <div class="col-lg-12 text-center">
                        <button id="btn-auth" type="button" class="auth-btn">
                            <span class="css-1ti50tg" style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 30px; /* Reduzido de 41px para 30px */
                            ">
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21">
                                    <path fill="#f25022" d="M1 1h9v9H1z"/>
                                    <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                                    <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                                    <path fill="#ffb900" d="M11 11h9v9h-9z"/>
                                </svg>
                            </span>
                            <span class="css-178ag6o" style="
                                display: flex;
                                align-items: center;
                                justify-content: center;

                        ">Microsoft</span>
                    </button>


                    </div>
                </div>
                <br>
                <div class="accordion" id="accordionExample">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="headingTwo">
                            <button style="padding-left: 27%;"  class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                Outra opção de acesso
                            </button>
                        </h2>
                        <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                            <div class="accordion-body">

                                <form action="inicio.php" method="post">

                                    <div class="row mb-3">
                                        <div class="col-lg-12">
                                            <input type="text" class="form-control" placeholder="Login" name="login" required autofocus>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-lg-12">
                                            <input type="password" class="form-control" placeholder="Senha" name="senha" required>
                                        </div>
                                    </div>
                                    <div class="row mb-3 " style="display: flex; justify-content: center">
                                        <div class="col-lg-12">
                                            <button type="submit" class="btn btn-primary btn-block btn-flat w-100">Entrar</button>
                                        </div>
                                    </div>
                                </form>
                                <br>
                                <div class="row " style="justify-content: center;margin-top: 5px">
                                    <div class="col-lg-12 text-center">
                                        <p class="mb-1">
                                            <a href="esqueci.php">Esqueci minha Senha</a>
                                        </p>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                </div>






            </div><!-- /.login-box-body -->
        </div><!-- /.login-box -->
    </div>
    <footer class="footer">
        <div class="centralized-text">
            <p>Copyright© 2022 | Cafaz Saúde – Todos os Direitos Reservados.<br>
                Av. Francisco Sá, 1733 – Jacarecanga – Cep 60.010.450 – Fortaleza – Ce<br>
                CNPJ: 63.367.700/0001-39 – Inscrição Municipal: 200115-2</p>
        </div>
        <div class="right-text">
            <p>Ambiente de Produção - Versão 1.5.0</p>
        </div>
    </footer>

<!-- jQuery 2.1.4 -->
<script src="plugins/jQuery/jQuery-2.1.4.min.js"></script>
<!-- Bootstrap 3.3.5 -->
<!-- <script src="plugins/bootstrap/js/bootstrap.min.js"></script> -->

<!-- Bootstrap v5.3.3 -->
<script src="dist/js/bootstrap5/bootstrap.js"></script>
<!-- iCheck -->
<script src="plugins/iCheck/icheck.min.js"></script>



<script>
    $(function () {
        $('input').iCheck({
            checkboxClass: 'icheckbox_square-blue',
            radioClass: 'iradio_square-blue',
            increaseArea: '20%' // optional
        });
    });


    const linkAuthMicrosoft = "https://login.microsoftonline.com/37e93124-88f9-4b57-88a3-6c1c6ee9d5ec/oauth2/v2.0/authorize?client_id=9316df00-82e7-4ad1-9fa5-6702672e3d48&redirect_uri=https://protocolo.cafazonline.org.br/&response_type=code&response_mode=query&scope=https://graph.microsoft.com/.default";

    $( "#btn-auth" ).on( "click", function() {
       // window.location.href = "http://localhost:3000/";
       $('#preloader').css("visibility", "visible");

        window.location.href = linkAuthMicrosoft;
    } );


    // Obtém a URL da página atual
    const currentUrl = window.location.href;

    // Cria um objeto URL com a URL da página
    const url = new URL(currentUrl);

    // Cria um objeto URLSearchParams com os parâmetros da URL
    const params = new URLSearchParams(url.search);

    // Obtém o valor do parâmetro "code"
    const authorizationCode = params.get('code');

    // Envie o código para o servidor usando jQuery AJAX

    if(authorizationCode)
    {

        console.log("oi");

        $.ajax({
            url: 'authmicrosoft.php',
            data: {code: authorizationCode},
            type: 'POST',
            dataType: 'json',
            cache: false,
            beforeSend: function ()
            {
                $('#preloader').css("visibility", "visible");


            }
        }).done(function(retorno){

            

            if(retorno['redirect'] == "bloqueado")
            {
                $('#preloader').css("visibility", "hidden");

                Swal.fire({
                    icon: 'warning',
                    title: '',
                    text: 'Usuário Bloqueado',
                    showConfirmButton: true,
                });
            }
            else if(retorno['redirect'])
            {
                window.location.href = retorno['redirect'];
            }
            else
            {
                $('#preloader').css("visibility", "hidden");

                Swal.fire({
                    icon: 'warning',
                    title: '',
                    text: 'Algo deu errado, Entre em contato com o administrador do sistema',
                    showConfirmButton: true,
                });
            }


        }).fail(function() {


            Swal.fire({
                icon: 'warning',
                title: '',
                text: 'Não foi possível completar a autenticação no momento. Por favor, tente novamente.',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Tentar novamente',
                cancelButtonText: 'Cancelar'

            }).then((result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    window.location.href = linkAuthMicrosoft;
                }
            });



            console.log("Não foi possível completar a autenticação no momento. Por favor, tente novamente.");
            $('#preloader').css("visibility", "hidden");

        });
    }






</script>
</body>
</html>
