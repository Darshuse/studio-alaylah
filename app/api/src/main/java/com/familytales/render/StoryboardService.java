package com.familytales.render;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * يحوّل نص الحكاية إلى لوحة قصصية: وصف بصري لكل مشهد.
 * تقطيع محلي موثوق من جُمل القصة نفسها (بلا واجهات نصية خارجية = خصوصية + استقرار).
 * أسلوب الرسم والشخصيات يُضافان في SceneGenerationService.
 */
@Service
public class StoryboardService {

    public List<String> build(String storyText, List<String> characterNames, int sceneCount) {
        List<String> sentences = new ArrayList<>();
        for (String s : storyText.split("(?<=[.!؟\\n])|،")) {
            String t = s.trim();
            if (t.length() >= 3) sentences.add(t);
        }
        if (sentences.isEmpty()) sentences.add(storyText.trim());

        List<String> scenes = new ArrayList<>();
        // وزّع الجمل على المشاهد بالتساوي
        double per = (double) sentences.size() / sceneCount;
        for (int i = 0; i < sceneCount; i++) {
            int from = (int) Math.floor(i * per);
            int to = Math.max(from + 1, (int) Math.floor((i + 1) * per));
            to = Math.min(to, sentences.size());
            from = Math.min(from, Math.max(0, sentences.size() - 1));
            StringBuilder sb = new StringBuilder();
            for (int j = from; j < to && j < sentences.size(); j++) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(sentences.get(j));
            }
            String desc = sb.toString().trim();
            if (desc.isEmpty()) desc = sentences.get(Math.min(i, sentences.size() - 1));
            scenes.add(desc);
        }
        return scenes;
    }
}
