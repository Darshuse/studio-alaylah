package com.familytales.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

/** توليد روابط موقّعة محدودة المدة للرفع/التنزيل المباشر من التخزين. */
@Service
public class StorageService {

    private final S3Presigner presigner;
    private final S3Client s3;
    private final String bucket;

    public StorageService(S3Presigner presigner, S3Client s3, @Value("${storage.bucket}") String bucket) {
        this.presigner = presigner;
        this.s3 = s3;
        this.bucket = bucket;
    }

    /** رابط رفع (PUT) موقّع صالح 15 دقيقة. */
    public String presignPut(String key, String contentType) {
        PutObjectRequest put = PutObjectRequest.builder()
            .bucket(bucket).key(key).contentType(contentType).build();
        PutObjectPresignRequest req = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(15))
            .putObjectRequest(put).build();
        return presigner.presignPutObject(req).url().toString();
    }

    /** رفع بايتات من الخادم مباشرة (للأصول المولّدة مثل صور المشاهد). */
    public void putBytes(String key, byte[] data, String contentType) {
        s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
            RequestBody.fromBytes(data));
    }

    /** تنزيل بايتات أصل من التخزين (لتركيب الفيديو). */
    public byte[] getBytes(String key) {
        return s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build()).asByteArray();
    }

    /** رابط تنزيل (GET) موقّع صالح 60 دقيقة. */
    public String presignGet(String key) {
        GetObjectRequest get = GetObjectRequest.builder().bucket(bucket).key(key).build();
        GetObjectPresignRequest req = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(60))
            .getObjectRequest(get).build();
        return presigner.presignGetObject(req).url().toString();
    }
}
