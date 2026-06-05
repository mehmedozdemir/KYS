using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kys.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint5_EnvironmentResource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    changed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    old_values = table.Column<string>(type: "jsonb", nullable: true),
                    new_values = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    correlation_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "environment_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_environment_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "shared_resources",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    resource_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    environment_scope = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    connection_fields = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_shared_resources", x => x.id);
                    table.ForeignKey(
                        name: "fk_shared_resources_resource_types_resource_type_id",
                        column: x => x.resource_type_id,
                        principalTable: "resource_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "customer_environments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    environment_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customer_environments", x => x.id);
                    table.ForeignKey(
                        name: "fk_customer_environments_customer_products_customer_product_id",
                        column: x => x.customer_product_id,
                        principalTable: "customer_products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_customer_environments_environment_types_environment_type_id",
                        column: x => x.environment_type_id,
                        principalTable: "environment_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "customer_environment_endpoints",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_environment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_endpoint_id = table.Column<Guid>(type: "uuid", nullable: false),
                    base_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    swagger_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    health_check_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    auth_type = table.Column<int>(type: "integer", nullable: true),
                    auth_config = table.Column<string>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customer_environment_endpoints", x => x.id);
                    table.ForeignKey(
                        name: "fk_customer_environment_endpoints_customer_environments_custom",
                        column: x => x.customer_environment_id,
                        principalTable: "customer_environments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_customer_environment_endpoints_product_endpoints_product_en",
                        column: x => x.product_endpoint_id,
                        principalTable: "product_endpoints",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "environment_resources",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_environment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_resource_template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_shared = table.Column<bool>(type: "boolean", nullable: false),
                    shared_resource_id = table.Column<Guid>(type: "uuid", nullable: true),
                    connection_fields = table.Column<string>(type: "jsonb", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_environment_resources", x => x.id);
                    table.ForeignKey(
                        name: "fk_environment_resources_customer_environments_customer_enviro",
                        column: x => x.customer_environment_id,
                        principalTable: "customer_environments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_environment_resources_product_resource_templates_product_re",
                        column: x => x.product_resource_template_id,
                        principalTable: "product_resource_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_environment_resources_shared_resources_shared_resource_id",
                        column: x => x.shared_resource_id,
                        principalTable: "shared_resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "resource_credentials",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    environment_resource_id = table.Column<Guid>(type: "uuid", nullable: true),
                    shared_resource_id = table.Column<Guid>(type: "uuid", nullable: true),
                    field_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    encrypted_value = table.Column<string>(type: "text", nullable: false),
                    iv = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_rotated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_resource_credentials", x => x.id);
                    table.ForeignKey(
                        name: "fk_resource_credentials_environment_resources_environment_reso",
                        column: x => x.environment_resource_id,
                        principalTable: "environment_resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_resource_credentials_shared_resources_shared_resource_id",
                        column: x => x.shared_resource_id,
                        principalTable: "shared_resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "environment_types",
                columns: new[] { "id", "code", "color", "description", "is_active", "name", "sort_order" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "DEV", "#6366F1", null, true, "Development", 1 },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "TEST", "#F59E0B", null, true, "Test", 2 },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "UAT", "#8B5CF6", null, true, "UAT", 3 },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "PROD", "#EF4444", null, true, "Production", 4 }
                });

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_changed_at",
                table: "audit_logs",
                column: "changed_at");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_changed_by",
                table: "audit_logs",
                column: "changed_by");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_entity_type_entity_id",
                table: "audit_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_customer_environment_endpoints_customer_environment_id_prod",
                table: "customer_environment_endpoints",
                columns: new[] { "customer_environment_id", "product_endpoint_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customer_environment_endpoints_product_endpoint_id",
                table: "customer_environment_endpoints",
                column: "product_endpoint_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_environments_customer_product_id",
                table: "customer_environments",
                column: "customer_product_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_environments_environment_type_id",
                table: "customer_environments",
                column: "environment_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_environment_resources_customer_environment_id",
                table: "environment_resources",
                column: "customer_environment_id");

            migrationBuilder.CreateIndex(
                name: "ix_environment_resources_product_resource_template_id",
                table: "environment_resources",
                column: "product_resource_template_id");

            migrationBuilder.CreateIndex(
                name: "ix_environment_resources_shared_resource_id",
                table: "environment_resources",
                column: "shared_resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_environment_types_code",
                table: "environment_types",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_resource_credentials_environment_resource_id_field_key",
                table: "resource_credentials",
                columns: new[] { "environment_resource_id", "field_key" },
                unique: true,
                filter: "environment_resource_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resource_credentials_shared_resource_id_field_key",
                table: "resource_credentials",
                columns: new[] { "shared_resource_id", "field_key" },
                unique: true,
                filter: "shared_resource_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_shared_resources_resource_type_id",
                table: "shared_resources",
                column: "resource_type_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "customer_environment_endpoints");

            migrationBuilder.DropTable(
                name: "resource_credentials");

            migrationBuilder.DropTable(
                name: "environment_resources");

            migrationBuilder.DropTable(
                name: "customer_environments");

            migrationBuilder.DropTable(
                name: "shared_resources");

            migrationBuilder.DropTable(
                name: "environment_types");
        }
    }
}
