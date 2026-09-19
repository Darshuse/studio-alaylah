package com.familytales.character;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "character_profiles")
public class CharacterProfileEntity {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "family_id", nullable = false)
    private UUID familyId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "age_label")
    private String ageLabel;

    // بذرة ثبات الهوية البصرية عبر كل المشاهد (الميزة الحاسمة)
    @Column(name = "identity_seed")
    private String identitySeed;

    @Column(name = "identity_ready", nullable = false)
    private boolean identityReady = false;

    // صورة الطفل الأصلية المرفوعة + الأفاتار الكرتوني المشتق منها
    @Column(name = "photo_key")
    private String photoKey;

    @Column(name = "avatar_key")
    private String avatarKey;

    // تسجيل صوت الأب مرة واحدة + معرّف النسخة الصوتية الدائمة (لسرد كل القصص بصوته)
    @Column(name = "voice_sample_key")
    private String voiceSampleKey;

    @Column(name = "voice_id")
    private String voiceId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getFamilyId() { return familyId; }
    public void setFamilyId(UUID familyId) { this.familyId = familyId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getAgeLabel() { return ageLabel; }
    public void setAgeLabel(String ageLabel) { this.ageLabel = ageLabel; }
    public String getIdentitySeed() { return identitySeed; }
    public void setIdentitySeed(String identitySeed) { this.identitySeed = identitySeed; }
    public boolean isIdentityReady() { return identityReady; }
    public void setIdentityReady(boolean identityReady) { this.identityReady = identityReady; }
    public String getPhotoKey() { return photoKey; }
    public void setPhotoKey(String photoKey) { this.photoKey = photoKey; }
    public String getAvatarKey() { return avatarKey; }
    public void setAvatarKey(String avatarKey) { this.avatarKey = avatarKey; }
    public String getVoiceSampleKey() { return voiceSampleKey; }
    public void setVoiceSampleKey(String voiceSampleKey) { this.voiceSampleKey = voiceSampleKey; }
    public String getVoiceId() { return voiceId; }
    public void setVoiceId(String voiceId) { this.voiceId = voiceId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
