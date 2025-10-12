<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attribution Jury PFE - Projets Encadrés</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
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
        .members-list {
            list-style: none;
            padding: 0;
            margin: 5px 0;
        }
        .members-list li {
            padding: 12px 15px;
            margin-bottom: 8px;
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .alert {
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid transparent;
            border-radius: 4px;
        }
        .alert-info {
            color: #0c5460;
            background-color: #d1ecf1;
            border-color: #bee5eb;
        }
        .alert-success {
            color: #155724;
            background-color: #d4edda;
            border-color: #c3e6cb;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        /* Role section styling */
        .role-section {
            margin-bottom: 30px;
        }
        .role-header {
            background-color: #f8f9fa;
            color: #495057;
            padding: 12px 20px;
            border-radius: 5px;
            margin: 0 0 20px 0;
            font-size: 1.1em;
            font-weight: bold;
            border-left: 4px solid #007bff;
        }
        .role-header.co-encadrant {
            border-left: 4px solid #007bff;
        }
        /* Desktop table styling */
        .pfe-table-container {
            overflow-x: auto;
            margin-bottom: 20px;
        }
        .pfe-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            min-width: 700px;
        }
        .pfe-table th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: bold;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-size: 0.9em;
        }
        .pfe-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
        }
        .pfe-table tr:last-child td {
            border-bottom: none;
        }
        .pfe-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .pfe-table tr:hover {
            background-color: #f8f9fa;
        }
        /* PFE content styling */
        .pfe-title {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
            line-height: 1.3;
        }
        .pfe-option {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin-bottom: 5px;
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
        /* Jury member styling */
        .jury-member {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 8px 12px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        .jury-member:last-child {
            margin-bottom: 0;
        }
        .jury-role {
            font-weight: bold;
            color: #495057;
            margin-right: 8px;
            min-width: 80px;
        }
        .jury-name {
            flex: 1;
            color: #212529;
        }
        .jury-grade {
            font-size: 0.85em;
            color: #6c757d;
            font-style: italic;
        }
        .students-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .students-list li {
            padding: 2px 0;
            color: #495057;
        }
        .students-list li:before {
            content: "👤 ";
            margin-right: 5px;
        }
        .no-pfes {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .intro-text {
            margin-bottom: 15px;
            color: #495057;
        }
        /* Mobile card layout */
        .pfe-cards {
            display: none;
        }
        .pfe-card {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .pfe-card-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e9ecef;
        }
        .pfe-card-content {
            display: grid;
            gap: 10px;
        }
        .jury-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 12px;
            margin-top: 10px;
        }
        .jury-info h4 {
            margin: 0 0 10px 0;
            color: #495057;
            font-size: 0.9em;
            font-weight: bold;
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
        .jury-list .jury-role {
            font-weight: bold;
            color: #495057;
            display: block;
            margin-bottom: 4px;
        }
        .jury-list .jury-member {
            color: #212529;
            font-size: 1.1em;
            background: none;
            border: none;
            padding: 0;
            margin: 0;
            display: block;
        }
        .jury-list .jury-grade {
            color: #6c757d;
            font-size: 0.9em;
            font-style: italic;
        }
        .status-error {
            color: #495057;
            font-style: italic;
        }
        /* Desktop layout for cards */
        @media (min-width: 768px) {
            .pfe-card .detail-row {
                display: flex;
                align-items: flex-start;
            }
            .pfe-card .detail-label {
                min-width: 120px;
                margin-bottom: 0;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .pfe-card .detail-value {
                flex: 1;
            }
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
            /* Hide table, show cards */
            .pfe-table-container {
                display: none;
            }
            .pfe-cards {
                display: block;
            }
            .role-header {
                padding: 10px 15px;
                font-size: 1em;
            }
            .pfe-card .detail-row {
                margin-bottom: 15px;
            }
            .pfe-card .detail-label {
                font-size: 14px;
                margin-bottom: 6px;
            }
            .pfe-card .detail-value {
                font-size: 14px;
                line-height: 1.4;
            }
            .jury-member {
                flex-direction: column;
                align-items: flex-start;
            }
            .jury-role {
                margin-bottom: 4px;
                min-width: auto;
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
            .pfe-card {
                padding: 12px;
            }
            .role-header {
                padding: 8px 12px;
                font-size: 0.9em;
            }
            .pfe-card .detail-label {
                font-size: 13px;
            }
            .pfe-card .detail-value {
                font-size: 13px;
            }
            .detail-label {
                font-size: 13px;
            }
            .detail-value {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ Attribution des Jurys PFE {{ date('Y') }}</h1>
    </div>
    <div class="content">
        <div class="intro-text">
            <p><strong>Bonjour {{ $encadrant->user->name }},</strong></p>
            <p>Voici les détails des jurys qui ont été attribués aux projets PFE que vous encadrez :</p>
        </div>
        
        @php
            $pfesEncadrant = $pfes->filter(function($pfe) use ($encadrant) {
                return $pfe->id_encadrant == $encadrant->id;
            });
            $pfesCoEncadrant = $pfes->filter(function($pfe) use ($encadrant) {
                return $pfe->id_co_encadrant == $encadrant->id;
            });
        @endphp
        
        @if($pfesEncadrant->count() > 0)
        <div class="role-section">
            <h2 class="role-header">🎯 PFE où vous êtes Encadrant Principal ({{ $pfesEncadrant->count() }} projet{{ $pfesEncadrant->count() > 1 ? 's' : '' }})</h2>
            
            <!-- Desktop Table View -->
            <div class="pfe-table-container">
                <table class="pfe-table">
                    <thead>
                        <tr>
                            <th>Projet</th>
                            <th>Jury Attribué</th>
                            <th>Co-encadrant</th>
                            <th>Groupe</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pfesEncadrant as $pfe)
                        <tr>
                            <td>
                                <div class="pfe-title">{{ $pfe->intitule }}</div>
                                <div class="pfe-option">{{ $pfe->option }}</div>
                                <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                                    {{ $pfe->type_sujet }}
                                </div>
                            </td>
                            <td>
                                @if($pfe->jury)
                                    <div class="jury-member">
                                        <span class="jury-role">Président:</span>
                                        <span class="jury-name">{{ $pfe->jury->president->user->name }}</span>
                                        <span class="jury-grade">({{ $pfe->jury->president->grade }})</span>
                                    </div>
                                    <div class="jury-member">
                                        <span class="jury-role">Examinateur:</span>
                                        <span class="jury-name">{{ $pfe->jury->examinateur->user->name }}</span>
                                        <span class="jury-grade">({{ $pfe->jury->examinateur->grade }})</span>
                                    </div>
                                @else
                                    <span class="status-error">Jury non attribué</span>
                                @endif
                            </td>
                            <td>{{ $pfe->coEncadrant->user->name ?? 'Aucun' }}</td>
                            <td>
                                <ul class="students-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            
            <!-- Mobile Card View -->
            <div class="pfe-cards">
                @foreach($pfesEncadrant as $pfe)
                <div class="pfe-card">
                    <div class="pfe-card-header">
                        <div class="pfe-title">{{ $pfe->intitule }}</div>
                        <div class="pfe-option">{{ $pfe->option }}</div>
                        <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                            {{ $pfe->type_sujet }}
                        </div>
                    </div>
                    <div class="pfe-card-content">
                        <div class="detail-row">
                            <span class="detail-label">Jury Attribué:</span>
                            <div class="detail-value">
                                @if($pfe->jury)
                                    <div class="jury-info">
                                        <h4>👨‍⚖️ Composition du Jury</h4>
                                        <ul class="jury-list">
                                            <li>
                                                <div class="jury-role">🎯 Président du jury :</div>
                                                <div class="jury-member">{{ $pfe->jury->president->user->name }}</div>
                                                <div class="jury-grade">({{ $pfe->jury->president->grade }})</div>
                                            </li>
                                            <li>
                                                <div class="jury-role">🔍 Examinateur :</div>
                                                <div class="jury-member">{{ $pfe->jury->examinateur->user->name }}</div>
                                                <div class="jury-grade">({{ $pfe->jury->examinateur->grade }})</div>
                                            </li>
                                        </ul>
                                    </div>
                                @else
                                    <span class="status-error">Jury non attribué</span>
                                @endif
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Co-encadrant:</span>
                            <span class="detail-value">{{ $pfe->coEncadrant->user->name ?? 'Aucun' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Groupe:</span>
                            <div class="detail-value">
                                <ul class="members-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif
        
        @if($pfesCoEncadrant->count() > 0)
        <div class="role-section">
            <h2 class="role-header co-encadrant">🤝 PFE où vous êtes Co-encadrant ({{ $pfesCoEncadrant->count() }} projet{{ $pfesCoEncadrant->count() > 1 ? 's' : '' }})</h2>
            
            <!-- Desktop Table View -->
            <div class="pfe-table-container">
                <table class="pfe-table">
                    <thead>
                        <tr>
                            <th>Projet</th>
                            <th>Jury Attribué</th>
                            <th>Encadrant Principal</th>
                            <th>Groupe</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pfesCoEncadrant as $pfe)
                        <tr>
                            <td>
                                <div class="pfe-title">{{ $pfe->intitule }}</div>
                                <div class="pfe-option">{{ $pfe->option }}</div>
                                <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                                    {{ $pfe->type_sujet }}
                                </div>
                            </td>
                            <td>
                                @if($pfe->jury)
                                    <div class="jury-member">
                                        <span class="jury-role">Président:</span>
                                        <span class="jury-name">{{ $pfe->jury->president->user->name }}</span>
                                        <span class="jury-grade">({{ $pfe->jury->president->grade }})</span>
                                    </div>
                                    <div class="jury-member">
                                        <span class="jury-role">Examinateur:</span>
                                        <span class="jury-name">{{ $pfe->jury->examinateur->user->name }}</span>
                                        <span class="jury-grade">({{ $pfe->jury->examinateur->grade }})</span>
                                    </div>
                                @else
                                    <span class="status-error">Jury non attribué</span>
                                @endif
                            </td>
                            <td>{{ $pfe->encadrant->user->name }}</td>
                            <td>
                                <ul class="students-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            
            <!-- Mobile Card View -->
            <div class="pfe-cards">
                @foreach($pfesCoEncadrant as $pfe)
                <div class="pfe-card">
                    <div class="pfe-card-header">
                        <div class="pfe-title">{{ $pfe->intitule }}</div>
                        <div class="pfe-option">{{ $pfe->option }}</div>
                        <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                            {{ $pfe->type_sujet }}
                        </div>
                    </div>
                    <div class="pfe-card-content">
                        <div class="detail-row">
                            <span class="detail-label">Jury Attribué:</span>
                            <div class="detail-value">
                                @if($pfe->jury)
                                    <div class="jury-info">
                                        <h4>👨‍⚖️ Composition du Jury</h4>
                                        <ul class="jury-list">
                                            <li>
                                                <div class="jury-role">🎯 Président du jury :</div>
                                                <div class="jury-member">{{ $pfe->jury->president->user->name }}</div>
                                                <div class="jury-grade">({{ $pfe->jury->president->grade }})</div>
                                            </li>
                                            <li>
                                                <div class="jury-role">🔍 Examinateur :</div>
                                                <div class="jury-member">{{ $pfe->jury->examinateur->user->name }}</div>
                                                <div class="jury-grade">({{ $pfe->jury->examinateur->grade }})</div>
                                            </li>
                                        </ul>
                                    </div>
                                @else
                                    <span class="status-error">Jury non attribué</span>
                                @endif
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Encadrant Principal:</span>
                            <span class="detail-value">{{ $pfe->encadrant->user->name }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Groupe:</span>
                            <div class="detail-value">
                                <ul class="members-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif
    </div>
    
    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des PFE.</p>
        <p>Pour toute question concernant les jurys, veuillez contacter l'administration.</p>
    </div>
</body>
</html>