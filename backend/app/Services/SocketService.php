<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class SocketService
{
    protected $socketServerUrl;

    public function __construct()
    {
        $this->socketServerUrl = config('services.socket.server_url', 'http://notifications-server:3001');
    }

    public function emit(string $event, array $data): bool
    {
        $endpoint = ($event === 'notification') ? '/emit-notification' : '/emit';

        try {
            $response = Http::timeout(5)->post($this->socketServerUrl . $endpoint, [
                'event' => $event,
                'data' => $data,
            ]);

            if ($response->failed()) {
                Log::error('Failed to emit to socket server', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'event' => $event,
                ]);
                return false;
            }

            return true;
        } catch (Exception $e) {
            Log::error('Exception when emitting to socket server', [
                'error' => $e->getMessage(),
                'event' => $event,
            ]);
            return false;
        }
    }

    public function emitNotification(string $userId, $notification): bool
    {
        try {
            Log::info('Emitting notification to socket server', [
                'userId' => $userId,
                'notification_id' => $notification->id ?? null,
                'notification_type' => $notification->type ?? null,
                'socket_url' => $this->socketServerUrl . '/emit-notification'
            ]);
            
            $response = Http::timeout(2)->post($this->socketServerUrl . '/emit-notification', [
                'userId' => $userId,
                'notification' => $notification
            ]);

            if ($response->failed()) {
                Log::error('Failed to emit notification to socket server', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'userId' => $userId
                ]);
                return false;
            }
            
            Log::info('Successfully emitted notification', [
                'userId' => $userId,
                'notification_id' => $notification->id ?? null
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Exception when emitting notification to socket server', [
                'error' => $e->getMessage(),
                'userId' => $userId
            ]);
            
            return false;
        }
    }
}