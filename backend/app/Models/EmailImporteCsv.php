<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailImporteCsv extends Model
{
    protected $table = 'emails_importes_csv';

    protected $fillable = [
        'role',
        'name',
        'email',
        'password',
    ];
}