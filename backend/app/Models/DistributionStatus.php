<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DistributionStatus extends Model
{
   protected $fillable = ['is_distributed', 'distributed_at'];
   public $timestamps = false;
}