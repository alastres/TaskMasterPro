
import { calculateEffectivePriority } from './src/services/task.service';
import { Priority, Task, TaskStatus } from '@prisma/client';

async function verifyPriorityToggle() {
    console.log('Verifying Priority Toggle Logic...');

    // Mock Task
    const mockTask: any = {
        id: '1',
        title: 'Test',
        description: 'Test',
        status: TaskStatus.PENDING,
        priority: Priority.LOW, // Manual priority is LOW
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 5), // Due in 5 hours
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'u1',
        projectId: null,
        tags: []
    };

    // Case 1: Auto Enabled (Default behavior)
    // Thresholds: Medium = 24h, High = 10h.
    // Due in 5h -> Should be HIGH.
    const userEnabled = {
        thresholdMedium: 24,
        thresholdHigh: 10,
        autoPriorityEnabled: true
    };

    // Need to cast to match the type expected by calculateEffectivePriority if types are mismatching
    const taskWithUserEnabled = { ...mockTask, user: userEnabled };

    const p1 = calculateEffectivePriority(taskWithUserEnabled as any);
    console.log(`Case 1 (Enabled, Due 5h, Threshold 10h): Expected HIGH, Got ${p1}`);
    if (p1 !== Priority.HIGH) console.error('FAILED Case 1');

    // Case 2: Auto Disabled
    // Should return manual priority (LOW)
    const userDisabled = {
        thresholdMedium: 24,
        thresholdHigh: 10,
        autoPriorityEnabled: false
    };
    const taskWithUserDisabled = { ...mockTask, user: userDisabled };

    const p2 = calculateEffectivePriority(taskWithUserDisabled as any);
    console.log(`Case 2 (Disabled, Due 5h, Threshold 10h, Manual LOW): Expected LOW, Got ${p2}`);
    if (p2 !== Priority.LOW) console.error('FAILED Case 2');

    // Case 3: Auto Enabled but overdue (should be HIGH)
    const p3 = calculateEffectivePriority({ ...mockTask, dueDate: new Date(Date.now() - 1000), user: userEnabled } as any);
    console.log(`Case 3 (Enabled, Overdue): Expected HIGH, Got ${p3}`);
    if (p3 !== Priority.HIGH) console.error('FAILED Case 3');

    // Case 4: Auto Disabled and overdue
    // Should still return manual LOW
    const p4 = calculateEffectivePriority({ ...mockTask, dueDate: new Date(Date.now() - 1000), user: userDisabled } as any);
    console.log(`Case 4 (Disabled, Overdue, Manual LOW): Expected LOW, Got ${p4}`);
    if (p4 !== Priority.LOW) console.error('FAILED Case 4');

}

verifyPriorityToggle();
