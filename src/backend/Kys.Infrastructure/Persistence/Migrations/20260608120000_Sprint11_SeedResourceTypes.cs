using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    public partial class Sprint11_SeedResourceTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO resource_types (id, name, code, category, icon, description, field_schema, is_active)
                VALUES
                ('b0000000-0000-0000-0000-000000000001', 'SQL Server',      'SQLSERVER',     'Veritabanı',      'database', 'Microsoft SQL Server veritabanı bağlantısı',               '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":1433},"database":{"type":"string","label":"Veritabanı Adı","required":true},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":true}}'::jsonb,     true),
                ('b0000000-0000-0000-0000-000000000002', 'Oracle',           'ORACLE',         'Veritabanı',      'database', 'Oracle Database bağlantısı',                               '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":1521},"service_name":{"type":"string","label":"Service Name / SID","required":true},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":true}}'::jsonb,      true),
                ('b0000000-0000-0000-0000-000000000003', 'PostgreSQL',       'POSTGRESQL',     'Veritabanı',      'database', 'PostgreSQL veritabanı bağlantısı',                         '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":5432},"database":{"type":"string","label":"Veritabanı Adı","required":true},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":true}}'::jsonb,       true),
                ('b0000000-0000-0000-0000-000000000004', 'MySQL',            'MYSQL',          'Veritabanı',      'database', 'MySQL / MariaDB veritabanı bağlantısı',                    '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":3306},"database":{"type":"string","label":"Veritabanı Adı","required":true},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":true}}'::jsonb,       true),
                ('b0000000-0000-0000-0000-000000000005', 'Redis',            'REDIS',          'Cache',           'server',   'Redis önbellekleme ve mesaj aracısı bağlantısı',           '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":6379},"password":{"type":"password","label":"Şifre","required":false},"db_index":{"type":"number","label":"DB İndeksi","required":false,"default":0}}'::jsonb,  true),
                ('b0000000-0000-0000-0000-000000000006', 'RabbitMQ',         'RABBITMQ',       'Mesajlaşma',      'send',     'RabbitMQ mesaj kuyruğu bağlantısı',                        '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":5672},"vhost":{"type":"string","label":"Virtual Host","required":false,"default":"/"},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":true}}'::jsonb,          true),
                ('b0000000-0000-0000-0000-000000000007', 'Elasticsearch',    'ELASTICSEARCH',  'Arama',           'search',   'Elasticsearch arama motoru bağlantısı',                    '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":9200},"username":{"type":"string","label":"Kullanıcı Adı","required":false},"password":{"type":"password","label":"Şifre","required":false},"index":{"type":"string","label":"Varsayılan İndeks","required":false}}'::jsonb, true),
                ('b0000000-0000-0000-0000-000000000008', 'MongoDB',          'MONGODB',        'Veritabanı',      'database', 'MongoDB NoSQL veritabanı bağlantısı',                      '{"connection_string":{"type":"password","label":"Connection String","required":true},"database":{"type":"string","label":"Veritabanı Adı","required":true}}'::jsonb,                                                                                                                                                                                                                              true),
                ('b0000000-0000-0000-0000-000000000009', 'MinIO / S3',       'MINIO_S3',       'Depolama',        'cloud',    'MinIO veya AWS S3 uyumlu nesne depolama bağlantısı',       '{"endpoint":{"type":"string","label":"Endpoint URL","required":true},"access_key":{"type":"string","label":"Access Key","required":true},"secret_key":{"type":"password","label":"Secret Key","required":true},"bucket":{"type":"string","label":"Varsayılan Bucket","required":false}}'::jsonb,                                                                                                        true),
                ('b0000000-0000-0000-0000-000000000010', 'SFTP',             'SFTP',           'Dosya Transferi', 'upload',   'SFTP dosya transfer sunucusu bağlantısı',                  '{"host":{"type":"string","label":"Sunucu Adresi","required":true},"port":{"type":"number","label":"Port","required":true,"default":22},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":false},"base_path":{"type":"string","label":"Temel Dizin","required":false,"default":"/"}}'::jsonb,                             true),
                ('b0000000-0000-0000-0000-000000000011', 'SMTP',             'SMTP',           'E-Posta',         'envelope', 'E-posta gönderimi için SMTP sunucu bağlantısı',            '{"host":{"type":"string","label":"SMTP Sunucusu","required":true},"port":{"type":"number","label":"Port","required":true,"default":587},"username":{"type":"string","label":"Kullanıcı Adı","required":true},"password":{"type":"password","label":"Şifre","required":true},"from_address":{"type":"string","label":"Gönderici Adresi","required":true}}'::jsonb,                                 true)
                ON CONFLICT DO NOTHING;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM resource_types
                WHERE id IN (
                    'b0000000-0000-0000-0000-000000000001',
                    'b0000000-0000-0000-0000-000000000002',
                    'b0000000-0000-0000-0000-000000000003',
                    'b0000000-0000-0000-0000-000000000004',
                    'b0000000-0000-0000-0000-000000000005',
                    'b0000000-0000-0000-0000-000000000006',
                    'b0000000-0000-0000-0000-000000000007',
                    'b0000000-0000-0000-0000-000000000008',
                    'b0000000-0000-0000-0000-000000000009',
                    'b0000000-0000-0000-0000-000000000010',
                    'b0000000-0000-0000-0000-000000000011'
                );
                """);
        }
    }
}
