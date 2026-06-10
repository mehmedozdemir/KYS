using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint28_AuthzCapabilities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "description",
                value: "Sistem/teknik yönetici — tüm yetkiler");

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "En üst iş otoritesi — tüm yetkiler", "[\"*\"]" });

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Kendi ekibinin ürünlerini yönetir (müşteri oluşturamaz)", "[\"customer:read\",\"product:*\",\"environment:*\",\"credential:*\",\"team:*\",\"person:read\",\"kb:*\"]" });

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000004"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Kendi çalıştığı ürünleri görür; yazma yetki (grant) ile", "[\"customer:read\",\"product:read\",\"environment:read\",\"credential:view\",\"team:read\",\"person:read\",\"kb:read\",\"kb:write\"]" });

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000005"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Atandığı kapsamda salt okuma", "[\"customer:read\",\"product:read\",\"team:read\",\"person:read\",\"environment:read\",\"kb:read\"]" });

            migrationBuilder.InsertData(
                table: "system_roles",
                columns: new[] { "id", "code", "description", "is_system", "name", "permissions" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000006"), "PO", "Müşteri/ürün oluşturur; sahibi olduğu ürünün tüm verisini yönetir", true, "Ürün Sahibi (PO)", "[\"customer:*\",\"product:*\",\"environment:*\",\"credential:*\",\"team:read\",\"team:write\",\"team:member\",\"person:read\",\"kb:*\"]" },
                    { new Guid("00000000-0000-0000-0000-000000000007"), "CTO", "Gözlemci — tüm sistemi salt okur", true, "CTO", "[\"customer:read\",\"product:read\",\"team:read\",\"person:read\",\"environment:read\",\"kb:read\",\"admin:audit\"]" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"));

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "description",
                value: "Tüm sistem yetkilerine sahip");

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Okuma ve raporlama yetkileri", "[\"read:*\",\"report:*\"]" });

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Ekip yönetimi ve kaynak düzenleme", "[\"read:*\",\"write:teams\",\"write:resources\",\"write:people.team\"]" });

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000004"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Atandığı ürün ve müşteri kayıtlarını görme", "[\"read:assigned\"]" });

            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000005"),
                columns: new[] { "description", "permissions" },
                values: new object[] { "Sadece genel listeleri okuma", "[\"read:lists\"]" });
        }
    }
}
