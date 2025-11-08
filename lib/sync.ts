import { Task, SyncOperation } from './types';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API base URL - можно настроить через переменные окружения
// На Android эмуляторе используем 10.0.2.2 вместо localhost
// На реальных устройствах (через Expo Go) нужен IP адрес компьютера
const getApiBaseUrl = (): string => {
    // Можно переопределить через переменную окружения в app.json
    if (Constants.expoConfig?.extra?.apiUrl) {
        return Constants.expoConfig.extra.apiUrl;
    }
    
    if (__DEV__) {
        // Для Android - всегда используем 10.0.2.2 для эмулятора
        // Для реального устройства нужно указать IP компьютера в app.json
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:3000';
        }
        
        // Для iOS
        if (Platform.OS === 'ios') {
            // Проверяем если это реальное устройство (Expo Go) или симулятор
            // В Expo Go executionEnvironment будет 'storeClient'
            // В симуляторе обычно 'bare' или undefined
            const isRealDevice = Constants.executionEnvironment === 'storeClient' || 
                                Constants.executionEnvironment === 'standalone';
            
            if (isRealDevice) {
                // Для реального устройства пытаемся получить IP из Expo dev server
                // Expo dev server обычно слушает на том же IP что и Metro bundler
                // Можно попробовать получить из Constants.manifest или использовать дефолтный IP
                // Но проще всего - использовать переменную окружения или определить автоматически
                
                // Пытаемся получить IP из manifest (если доступен)
                const manifest = Constants.manifest2 || Constants.manifest;
                if (manifest?.hostUri) {
                    // hostUri обычно в формате "192.168.1.6:8081"
                    const host = manifest.hostUri.split(':')[0];
                    if (host && host !== 'localhost' && host !== '127.0.0.1') {
                        return `http://${host}:3000`;
                    }
                }
                
                // Если не получилось определить автоматически, используем localhost
                // Но это не сработает на реальном устройстве, поэтому лучше указать в app.json
                console.warn('[Sync] Real iOS device detected but IP not found. Using localhost (may not work). Set apiUrl in app.json extra section.');
                return 'http://localhost:3000';
            } else {
                // Симулятор - localhost работает
                return 'http://localhost:3000';
            }
        }
        
        // Для веба
        return 'http://localhost:3000';
    }
    // В продакшене заменить на реальный URL
    return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

// Логируем какой URL используется при старте
console.log(`[Sync] Platform: ${Platform.OS}, Execution: ${Constants.executionEnvironment}, API URL: ${API_BASE_URL}`);

const MAX_RETRIES = 3;

/**
 * Проверяет доступность API сервера
 */
export async function checkApiConnection(): Promise<boolean> {
    try {
        console.log(`[Sync] Checking API connection to ${API_BASE_URL}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const isOk = response.ok;
        console.log(`[Sync] API connection check: ${isOk ? 'OK' : 'FAILED'} (status: ${response.status})`);
        return isOk;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[Sync] API connection check failed: ${errorMessage}`);
        console.warn(`[Sync] Trying to connect to: ${API_BASE_URL}`);
        return false;
    }
}

/**
 * Создает задачу на сервере
 */
export async function createTaskOnServer(task: Task): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    });

    if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Обновляет задачу на сервере
 */
export async function updateTaskOnServer(taskId: string, task: Task): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    });

    if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Удаляет задачу на сервере
 */
export async function deleteTaskOnServer(taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
    }
}

/**
 * Получает все задачи с сервера
 */
export async function fetchTasksFromServer(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Выполняет одну операцию синхронизации
 */
export async function executeSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
        case 'create':
            if (!operation.taskData) {
                throw new Error('Task data is required for create operation');
            }
            await createTaskOnServer(operation.taskData);
            break;
        case 'update':
            if (!operation.taskData) {
                throw new Error('Task data is required for update operation');
            }
            await updateTaskOnServer(operation.taskId, operation.taskData);
            break;
        case 'delete':
            await deleteTaskOnServer(operation.taskId);
            break;
        default:
            throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
}

/**
 * Выполняет синхронизацию всех операций из очереди
 */
export async function syncPendingOperations(
    operations: SyncOperation[],
    onOperationComplete: (operationId: string) => void,
    onOperationFailed: (operationId: string, error: Error) => void,
    onOperationRetry: (operationId: string) => void
): Promise<void> {
    console.log(`[Sync] Starting sync for ${operations.length} operation(s)...`);
    
    // Проверяем доступность API
    const isConnected = await checkApiConnection();
    if (!isConnected) {
        const error = new Error(`API server is not available at ${API_BASE_URL}. Make sure json-server is running with: npm run server`);
        console.error(`[Sync] ${error.message}`);
        throw error;
    }

    // Выполняем операции последовательно
    for (const operation of operations) {
        try {
            console.log(`[Sync] Executing ${operation.type} operation for task ${operation.taskId}...`);
            await executeSyncOperation(operation);
            console.log(`[Sync] ✓ Successfully synced ${operation.type} operation for task ${operation.taskId}`);
            onOperationComplete(operation.id);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            
            // Если операция провалилась и retries < MAX_RETRIES, увеличиваем retries
            if (operation.retries < MAX_RETRIES) {
                // Вызываем onOperationRetry чтобы увеличить retries, операция останется в очереди
                console.warn(`[Sync] ✗ Operation failed, will retry (${operation.retries + 1}/${MAX_RETRIES}):`, err.message);
                onOperationRetry(operation.id);
            } else {
                // Превышен лимит попыток
                console.error(`[Sync] ✗ Operation failed after ${MAX_RETRIES} retries:`, err.message);
                onOperationFailed(operation.id, err);
            }
        }
    }
    
    console.log(`[Sync] Sync completed`);
}

