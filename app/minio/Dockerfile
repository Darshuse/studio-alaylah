# MinIO الرسمي (تخزين S3-متوافق) من quay.io (Docker Hub محجوب/rate-limited على البيلدر).
# الـbucket يُنشأ تلقائيًا من التطبيق (StorageService.ensureBucket).
FROM quay.io/minio/minio:latest
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--address", ":9000", "--console-address", ":9001"]
