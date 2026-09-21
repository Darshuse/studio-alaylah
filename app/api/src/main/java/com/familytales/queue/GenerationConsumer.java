package com.familytales.queue;

import com.familytales.render.SceneGenerationService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * مستهلك مهام التوليد (worker). يعمل حاليًا داخل نفس التطبيق،
 * وقابل للفصل لعملية workers مستقلة تُوسَّع أفقيًا (بلا تغيير كود).
 * التزامن يُضبط عبر spring.rabbitmq.listener.simple.concurrency.
 */
@Component
public class GenerationConsumer {

    private final SceneGenerationService generation;

    public GenerationConsumer(SceneGenerationService generation) {
        this.generation = generation;
    }

    @RabbitListener(queues = "${queue.generation:ft.generation}")
    public void onMessage(GenerationMessage m) {
        // يعالج المهمة؛ الأخطاء التجارية تُلتقط داخليًا (job=failed).
        // أي استثناء غير متوقّع → يرفضه الطابور لـdead-letter.
        generation.process(m.jobId(), m.storyId(), m.familyId(), m.sceneCount(), m.watermark());
    }
}
