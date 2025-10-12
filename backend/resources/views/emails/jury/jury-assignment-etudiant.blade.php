<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attribution du jury pour votre PFE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #212529;
            font-size: 1.5em;
        }
        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
        }
        .intro-text {
            margin-bottom: 15px;
            color: #495057;
        }
        .intro-text p {
            margin-bottom: 12px;
        }
        .alert {
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid transparent;
            border-radius: 4px;
        }
        .alert-success {
            color: #155724;
            background-color: #d4edda;
            border-color: #c3e6cb;
        }
        .alert-info {
            color: #0c5460;
            background-color: #d1ecf1;
            border-color: #bee5eb;
        }
        .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .info-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #495057;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
            font-size: 1.1em;
        }
        .detail-row {
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: bold;
            color: #495057;
            display: block;
            margin-bottom: 4px;
        }
        .detail-value {
            color: #212529;
            display: block;
        }
        .option-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #007bff;
            color: white;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .pfe-type {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .type-industrie {
            background-color: #d4edda;
            color: #155724;
        }
        .type-academique {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .type-recherche {
            background-color: #f8d7da;
            color: #721c24;
        }
        .type-stage {
            background-color: #fff3cd;
            color: #856404;
        }
        .resume-text {
            line-height: 1.6;
            color: #212529;
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .technologies-list, .besoins-list {
            margin: 5px 0;
            padding-left: 20px;
        }
        .technologies-list li, .besoins-list li {
            margin-bottom: 5px;
            color: #495057;
        }
        .jury-list {
            list-style: none;
            padding: 0;
            margin: 5px 0;
        }
        .jury-list li {
            padding: 12px 15px;
            margin-bottom: 8px;
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .jury-role {
            font-weight: bold;
            color: #495057;
            display: block;
            margin-bottom: 4px;
        }
        .jury-member {
            color: #212529;
            font-size: 1.1em;
        }
        .jury-grade {
            color: #6c757d;
            font-size: 0.9em;
            font-style: italic;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        
        /* Desktop layout */
        @media (min-width: 768px) {
            .detail-row {
                display: flex;
                align-items: flex-start;
            }
            .detail-label {
                min-width: 140px;
                margin-bottom: 0;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .detail-value {
                flex: 1;
            }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 767px) {
            body {
                padding: 10px;
                font-size: 14px;
            }
            .header {
                padding: 15px;
            }
            .header h1 {
                font-size: 1.4em;
            }
            .content {
                padding: 15px;
            }
            .info-section {
                padding: 12px;
            }
            .detail-row {
                margin-bottom: 15px;
            }
            .detail-label {
                font-size: 14px;
                margin-bottom: 6px;
            }
            .detail-value {
                font-size: 14px;
                line-height: 1.4;
            }
            .alert {
                padding: 10px;
                font-size: 14px;
            }
            .jury-list li {
                padding: 10px 12px;
                font-size: 14px;
            }
            .jury-member {
                font-size: 1em;
            }
            .resume-text {
                font-size: 13px;
                padding: 10px;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 5px;
                font-size: 13px;
            }
            .header {
                padding: 10px;
            }
            .header h1 {
                font-size: 1.2em;
                line-height: 1.3;
            }
            .content {
                padding: 10px;
            }
            .info-section {
                padding: 10px;
                margin-bottom: 15px;
            }
            .info-section h3 {
                font-size: 1.1em;
            }
            .detail-label {
                font-size: 13px;
            }
            .detail-value {
                font-size: 13px;
            }
            .jury-list li {
                padding: 8px 10px;
            }
            .jury-member {
                font-size: 0.95em;
            }
            .jury-grade {
                font-size: 0.85em;
            }
            .resume-text {
                font-size: 12px;
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ Attribution du jury pour votre PFE</h1>
    </div>
    
    <div class="content">
        <div class="intro-text">
            <p><strong>Cher(e) {{ $student->name }},</strong></p>
            <p>Nous avons le plaisir de vous informer que le jury pour votre soutenance PFE a été constitué.</p>
        </div>
        
        <div class="alert alert-success">
            <strong>🎉 Bonne nouvelle :</strong> Votre jury de soutenance a été officiellement constitué et vous recevrez bientôt les informations concernant la date de soutenance.
        </div>
        
        <!-- Informations du PFE -->
        <div class="info-section">
            <h3>📋 Projet de Fin d'Études</h3>
            <div class="detail-row">
                <span class="detail-label">Intitulé :</span>
                <span class="detail-value">{{ $pfe->intitule }}</span>
            </div>
            @if($pfe->option)
            <div class="detail-row">
                <span class="detail-label">Option :</span>
                <span class="detail-value">
                    <span class="option-badge">{{ $pfe->option }}</span>
                </span>
            </div>
            @endif
            <div class="detail-row">
                <span class="detail-label">Type de sujet :</span>
                <span class="detail-value">
                    <span class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                        {{ $pfe->type_sujet }}
                    </span>
                </span>
            </div>
            @if($pfe->resume)
            <div class="detail-row">
                <span class="detail-label">Résumé :</span>
                <span class="detail-value">
                    <div class="resume-text">{{ $pfe->resume }}</div>
                </span>
            </div>
            @endif
        </div>
        
        <!-- Informations techniques -->
        @if($pfe->technologies_utilisees || $pfe->besoins_materiels)
        <div class="info-section">
            <h3>🔧 Informations Techniques</h3>
            @if($pfe->technologies_utilisees)
            <div class="detail-row">
                <span class="detail-label">Technologies utilisées :</span>
                <span class="detail-value">
                    @if(is_array($pfe->technologies_utilisees))
                        <ul class="technologies-list">
                            @foreach($pfe->technologies_utilisees as $tech)
                                <li>{{ $tech }}</li>
                            @endforeach
                        </ul>
                    @else
                        {{ $pfe->technologies_utilisees }}
                    @endif
                </span>
            </div>
            @endif
            @if($pfe->besoins_materiels)
            <div class="detail-row">
                <span class="detail-label">Besoins matériels :</span>
                <span class="detail-value">
                    @if(is_array($pfe->besoins_materiels))
                        <ul class="besoins-list">
                            @foreach($pfe->besoins_materiels as $besoin)
                                <li>{{ $besoin }}</li>
                            @endforeach
                        </ul>
                    @else
                        {{ $pfe->besoins_materiels }}
                    @endif
                </span>
            </div>
            @endif
        </div>
        @endif
        
        <!-- Encadrement -->
        <div class="info-section">
            <h3>👨‍🏫 Encadrement</h3>
            @if($pfe->encadrant)
            <div class="detail-row">
                <span class="detail-label">Encadrant :</span>
                <span class="detail-value">
                    {{ $pfe->encadrant->user->name ?? 'Non spécifié' }}
                    @if($pfe->encadrant->grade)
                        <span class="jury-grade">({{ $pfe->encadrant->grade }})</span>
                    @endif
                </span>
            </div>
            @endif
            @if($pfe->coEncadrant)
            <div class="detail-row">
                <span class="detail-label">Co-encadrant :</span>
                <span class="detail-value">
                    {{ $pfe->coEncadrant->user->name ?? 'Non spécifié' }}
                    @if($pfe->coEncadrant->grade)
                        <span class="jury-grade">({{ $pfe->coEncadrant->grade }})</span>
                    @endif
                </span>
            </div>
            @endif
        </div>
        
        <!-- Composition du jury -->
        <div class="info-section">
            <h3>👨‍⚖️ Composition du Jury</h3>
            <ul class="jury-list">
                <li>
                    <div class="jury-role">🎯 Président du jury :</div>
                    <div class="jury-member">{{ $president->user->name ?? $president->nom }}</div>
                    <div class="jury-grade">({{ $president->grade }})</div>
                </li>
                <li>
                    <div class="jury-role">🔍 Examinateur :</div>
                    <div class="jury-member">{{ $examinateur->user->name ?? $examinateur->nom }}</div>
                    <div class="jury-grade">({{ $examinateur->grade }})</div>
                </li>
            </ul>
        </div>
        
        <div class="alert alert-info">
            <strong>Prochaines étapes :</strong> Vous recevrez bientôt un email avec la date, l'heure et le lieu de votre soutenance. Assurez-vous de bien préparer votre présentation et votre rapport final.
        </div>
    </div>
    
    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des PFE.</p>
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>
