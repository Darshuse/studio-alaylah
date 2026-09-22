# MinIO الرسمي (تخزين S3-متوافق). الـbucket يُنشأ تلقائيًا من التطبيق (StorageService.ensureBucket).
FROM minio/minio:latest
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--address", ":9000", "--console-address", ":9001"]
