package com.familytales.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * مجمّع خيوط محدود للتوليد الثقيل في الخلفية.
 * يستبدل SimpleAsyncTaskExecutor الافتراضي (يصنع خيطًا لكل مهمة بلا حد → خطر OOM تحت الضغط).
 * حلّ مؤقت سليم قبل الانتقال لطابور RabbitMQ حقيقي (workers منفصلة قابلة للتوسّع).
 */
@Configuration
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        return generationExecutor();
    }

    @Bean("generationExecutor")
    public ThreadPoolTaskExecutor generationExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(3);          // توليدات متزامنة أساسية
        ex.setMaxPoolSize(6);           // ذروة (كل مهمة تستهلك ذاكرة + نداءات مزوّدين)
        ex.setQueueCapacity(100);       // طابور داخلي — يمتصّ الدفعات بدل رفض فوري
        ex.setThreadNamePrefix("gen-");
        ex.setKeepAliveSeconds(60);
        // عند الامتلاء: لا تُسقِط ولا تخنق الويب — شغّلها على خيط المُرسِل (backpressure طبيعي)
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(120);
        ex.initialize();
        return ex;
    }
}
