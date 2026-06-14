using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint13_PersonalCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "personal_credentials",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    environment_resource_id = table.Column<Guid>(type: "uuid", nullable: true),
                    shared_resource_id = table.Column<Guid>(type: "uuid", nullable: true),
                    owner_person_id = table.Column<Guid>(type: "uuid", nullable: false),
                    field_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    encrypted_value = table.Column<string>(type: "text", nullable: false),
                    iv = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_rotated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_personal_credentials", x => x.id);
                    table.ForeignKey(
                        name: "fk_personal_credentials_environment_resources_environment_reso",
                        column: x => x.environment_resource_id,
                        principalTable: "environment_resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_personal_credentials_people_owner_person_id",
                        column: x => x.owner_person_id,
                        principalTable: "people",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_personal_credentials_shared_resources_shared_resource_id",
                        column: x => x.shared_resource_id,
                        principalTable: "shared_resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_personal_credentials_environment_resource_id",
                table: "personal_credentials",
                column: "environment_resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_personal_credentials_owner_person_id",
                table: "personal_credentials",
                column: "owner_person_id");

            migrationBuilder.CreateIndex(
                name: "ix_personal_credentials_shared_resource_id",
                table: "personal_credentials",
                column: "shared_resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_personal_credentials_owner_person_id_environment_resource_id_field_key",
                table: "personal_credentials",
                columns: new[] { "owner_person_id", "environment_resource_id", "field_key" },
                unique: true,
                filter: "environment_resource_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_personal_credentials_owner_person_id_shared_resource_id_field_key",
                table: "personal_credentials",
                columns: new[] { "owner_person_id", "shared_resource_id", "field_key" },
                unique: true,
                filter: "shared_resource_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "personal_credentials");
        }
    }
}
