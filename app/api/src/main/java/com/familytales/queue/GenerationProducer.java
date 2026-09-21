package com.familytales.queue;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** ينشر مهمة التوليد في الطابور (يستدعيه الـAPI ويرجع فورًا). */
@Service
public class GenerationProducer {

    private final RabbitTemplate rabbit;
    private final String queueName;

    public GenerationProducer(RabbitTemplate rabbit, @Value("${queue.generation:ft.generation}") String queueName) {
        this.rabbit = rabbit;
        this.queueName = queueName;
    }

    public void enqueue(GenerationMessage msg) {
        rabbit.convertAndSend(queueName, msg);
    }
}
