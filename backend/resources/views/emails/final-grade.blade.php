<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Résultats PFE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
        }
        .grade-box {
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            margin: 20px 0;
        }
        .grade-box.success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
        }
        .grade-box.danger {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
        }
        .grade-value {
            font-size: 24px;
            font-weight: bold;
        }
        .grade-value.success {
            color: #155724;
        }
        .grade-value.danger {
            color: #721c24;
        }
        .message.success {
            color: #155724;
            font-weight: bold;
        }
        .message.danger {
            color: #721c24;
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        .congratulations {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
        }
        .encouragement {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Résultats de votre Projet de Fin d'Études</h1>
    </div>
    
    <div class="content">
        <p>Bonjour <strong>{{ $studentName }}</strong>,</p>
        
        <p>Nous avons le plaisir de vous communiquer les résultats de votre Projet de Fin d'Études.</p>
        
        <p><strong>Projet :</strong> {{ $pfeTitle }}</p>
        
        <div class="grade-box {{ $finalGrade >= 10 ? 'success' : 'danger' }}">
            <p>Votre note finale est :</p>
            <div class="grade-value {{ $finalGrade >= 10 ? 'success' : 'danger' }}">
                {{ number_format($finalGrade, 2) }}/20
            </div>
        </div>
        
        @if($finalGrade >= 10)
            <div class="congratulations">
                <p class="message success">🎉 Félicitations ! Vous avez réussi votre Projet de Fin d'Études avec succès !</p>
                <p>Votre travail remarquable et votre engagement tout au long de ce projet ont porté leurs fruits. Nous sommes fiers de votre accomplissement et vous souhaitons beaucoup de succès dans votre future carrière professionnelle.</p>
            </div>
        @else
            <div class="encouragement">
                <p class="message danger">Malheureusement, votre note est en dessous de la moyenne requise.</p>
                <p>Nous vous encourageons à ne pas vous décourager. Cette expérience fait partie de votre parcours d'apprentissage. Nous vous invitons à prendre contact avec votre encadrant pour discuter des possibilités de rattrapage ou d'amélioration.</p>
                <p><strong>N'abandonnez pas, chaque échec est une opportunité d'apprendre et de grandir ! 💪</strong></p>
            </div>
        @endif
        
        <p>Pour toute question concernant vos résultats, n'hésitez pas à contacter votre encadrant ou l'administration.</p>
        
        <p>Cordialement,<br>
        L'équipe pédagogique</p>
    </div>
    
    <div class="footer">
        <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
    </div>
</body>
</html>
