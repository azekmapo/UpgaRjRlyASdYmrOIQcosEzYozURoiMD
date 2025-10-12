<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Proposition PFE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #212529;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }

        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
        }

        .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }

        .info-section h3 {
            margin-top: 0;
            color: #495057;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }

        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }

        .detail-label {
            font-weight: bold;
            min-width: 120px;
            color: #495057;
        }

        .status-accepted {
            color: #28a745;
            font-weight: bold;
        }

        .status-declined {
            color: #dc3545;
            font-weight: bold;
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

        .alert-danger {
            color: #721c24;
            background-color: #f8d7da;
            border-color: #f5c6cb;
        }

        .alert-info {
            color: #0c5460;
            background-color: #d1ecf1;
            border-color: #bee5eb;
        }

        .alert-warning {
            color: #856404;
            background-color: #fff3cd;
            border-color: #ffeaa7;
        }

        .remarks {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }

        .greeting {
            font-weight: bold;
            font-size: 1.1em;
            margin-bottom: 15px;
        }

        .spec-item {
            background-color: #ffffff;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }

        .spec-item:last-child {
            margin-bottom: 0;
        }

        .spec-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
            font-size: 14px;
        }

        .final-message {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            border-left: 4px solid #28a745;
            font-style: italic;
        }

        .spec-value {
            white-space: pre-wrap;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>
            @if($emailValidation->status === 'accepted')
            ✅ Proposition PFE Acceptée
            @else
            ❌ Proposition PFE Refusée
            @endif
        </h1>
    </div>

    <div class="content">
        @if($emailValidation->role === 'etudiant')
        <div class="greeting">Cher{{ $emailValidation->name2 ? 's' : '' }} {{ $emailValidation->name }}@if($emailValidation->name2), {{ $emailValidation->name2 }}@endif,</div>

        @if($emailValidation->status === 'accepted')
        <div class="alert alert-success">
            <strong>🎉 Félicitations !</strong> Votre proposition de Projet de Fin d'Études a été validée et acceptée par la commission pédagogique.
        </div>
        @else
        <div class="alert alert-danger">
            <strong>⚠️ Notification importante :</strong> Votre proposition de Projet de Fin d'Études n'a pas été retenue par la commission pédagogique.
        </div>
        @endif

        @if($emailValidation->remarques)
        <div class="info-section">
            <h3>📝 Observations de la Commission</h3>
            <div class="remarks spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->remarques))) !!}</div>
        </div>
        @endif

        @if($emailValidation->status === 'accepted')
        <div class="info-section">
            <h3>🎯 Spécifications Validées</h3>
            <div class="spec-item">
                <div class="spec-label">Intitulé :</div>
                <div class="spec-value">{{ $emailValidation->intitule }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Option :</div>
                <div class="spec-value">{{ $emailValidation->option }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Type :</div>
                <div class="spec-value">{{ $emailValidation->type }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Résumé :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->resumer))) !!}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Technologies :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->technologies))) !!}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Besoins matériels :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->besoins_materiels))) !!}</div>
            </div>
        </div>
        @else
        <div class="info-section">
            <h3>📋 Intitulé</h3>
            <div class="detail-row">
                <span class="detail-value">{{ $emailValidation->intitule }}</span>
            </div>
        </div>
        @endif

        @elseif($emailValidation->role === 'enseignant')
        <div class="greeting">Cher{{ $emailValidation->name2 ? 's collègues' : ' collègue' }} {{ $emailValidation->name }} (Encadrant)@if($emailValidation->name2), {{ $emailValidation->name2 }} (Co-encadrant)@endif,</div>

        @if($emailValidation->status === 'accepted')
        <div class="alert alert-success">
            <strong>✅ Validation confirmée :</strong> Votre proposition de Projet de Fin d'Études a été approuvée par la commission pédagogique.
        </div>
        @else
        <div class="alert alert-danger">
            <strong>❌ Décision de la commission :</strong> Votre proposition de Projet de Fin d'Études n'a pas été retenue.
        </div>
        @endif

        @if($emailValidation->remarques)
        <div class="info-section">
            <h3>📝 Observations de la Commission</h3>
            <div class="remarks spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->remarques))) !!}</div>
        </div>
        @endif

        @if($emailValidation->status === 'accepted')
        <div class="info-section">
            <h3>🎯 Spécifications Validées</h3>
            <div class="spec-item">
                <div class="spec-label">Intitulé :</div>
                <div class="spec-value">{{ $emailValidation->intitule }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Option :</div>
                <div class="spec-value">{{ $emailValidation->option }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Type :</div>
                <div class="spec-value">{{ $emailValidation->type }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Résumé :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->resumer))) !!}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Technologies :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->technologies))) !!}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Besoins matériels :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->besoins_materiels))) !!}</div>
            </div>
        </div>
        @else
        <div class="info-section">
            <h3>📋 Intitulé</h3>
            <div class="detail-row">
                <span class="detail-value">{{ $emailValidation->intitule }}</span>
            </div>
        </div>
        @endif

        @elseif($emailValidation->role === 'entreprise')
        <div class="greeting">Cher{{ $emailValidation->name2 ? 's' : '' }} {{ $emailValidation->name }},</div>
        <p class="greeting">Au nom de l'entreprise {{ $emailValidation->denomination }},</p>

        @if($emailValidation->status === 'accepted')
        <div class="alert alert-success">
            <strong>🤝 Partenariat confirmé :</strong> Votre proposition de Projet de Fin d'Études a été acceptée par notre établissement.
        </div>
        @else
        <div class="alert alert-danger">
            <strong>📋 Décision académique :</strong> Votre proposition de Projet de Fin d'Études n'a pas été retenue pour cette session.
        </div>
        @endif

        @if($emailValidation->remarques)
        <div class="info-section">
            <h3>📝 Observations Académiques</h3>
            <div class="remarks spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->remarques))) !!}</div>
        </div>
        @endif

        @if($emailValidation->status === 'accepted')
        <div class="info-section">
            <h3>🎯 Spécifications Validées</h3>
            <div class="spec-item">
                <div class="spec-label">Intitulé :</div>
                <div class="spec-value">{{ $emailValidation->intitule }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Option :</div>
                <div class="spec-value">{{ $emailValidation->option }}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Résumé :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->resumer))) !!}</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">Technologies :</div>
                <div class="spec-value">{!! nl2br(str_replace(' ', ' &nbsp;', e($emailValidation->technologies))) !!}</div>
            </div>
        </div>
        @else
        <div class="info-section">
            <h3>📋 Intitulé</h3>
            <div class="detail-row">
                <span class="detail-value">{{ $emailValidation->intitule }}</span>
            </div>
        </div>
        @endif
        @endif

        @if($emailValidation->status === 'accepted')
        <div class="final-message">
            Nous vous souhaitons plein succès dans la réalisation de votre projet et restons à votre disposition pour tout accompagnement nécessaire.
        </div>
        @else
        <div class="alert alert-warning">
            <strong>💡 Prochaines Étapes :</strong> Ce n’est qu’une étape. Reste actif sur la plateforme de nouvelles opportunités sont à venir très prochainement !
        </div>
        @endif
    </div>

    <div class="footer">
        <p>Cordialement,<br>La Commission Pédagogique des Projets de Fin d'Études</p>
    </div>
</body>

</html>