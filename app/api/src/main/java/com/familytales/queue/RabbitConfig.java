package com.familytales.queue;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * طابور التوليد الثقيل: منتِج (الـAPI) → RabbitMQ → مستهلكون (workers).
 * المهمة الفاشلة تُوجّه لطابور dead-letter بدل إعادة لانهائية.
 */
@Configuration
public class RabbitConfig {

    private final String queueName;
    private final String dlqName;

    public RabbitConfig(@Value("${queue.generation:ft.generation}") String queueName) {
        this.queueName = queueName;
        this.dlqName = queueName + ".dlq";
    }

    @Bean
    public Queue generationQueue() {
        // عند الرفض/الفشل → أرسل لطابور الموتى
        return QueueBuilder.durable(queueName)
            .withArgument("x-dead-letter-exchange", "")
            .withArgument("x-dead-letter-routing-key", dlqName)
            .build();
    }

    @Bean
    public Queue generationDlq() {
        return QueueBuilder.durable(dlqName).build();
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter converter) {
        RabbitTemplate t = new RabbitTemplate(cf);
        t.setMessageConverter(converter);
        return t;
    }
}
