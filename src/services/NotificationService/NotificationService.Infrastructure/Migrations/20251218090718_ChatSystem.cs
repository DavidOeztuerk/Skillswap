using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NotificationService.Migrations
{
    /// <inheritdoc />
    public partial class ChatSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatThreads",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ThreadId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Participant1Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Participant2Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Participant1Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Participant2Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Participant1AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Participant2AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    SkillName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    MatchId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastMessagePreview = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    LastMessageSenderId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Participant1UnreadCount = table.Column<int>(type: "integer", nullable: false),
                    Participant2UnreadCount = table.Column<int>(type: "integer", nullable: false),
                    TotalMessageCount = table.Column<int>(type: "integer", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    LockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockReason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Participant1IsTyping = table.Column<bool>(type: "boolean", nullable: false),
                    Participant2IsTyping = table.Column<bool>(type: "boolean", nullable: false),
                    Participant1TypingAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Participant2TypingAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatThreads", x => x.Id);
                    table.UniqueConstraint("AK_ChatThreads_ThreadId", x => x.ThreadId);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ThreadId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    SenderId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    SenderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SenderAvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Content = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    RenderedHtml = table.Column<string>(type: "text", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsEdited = table.Column<bool>(type: "boolean", nullable: false),
                    MessageType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Context = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ContextReferenceId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    IsEncrypted = table.Column<bool>(type: "boolean", nullable: false),
                    EncryptedContent = table.Column<string>(type: "text", nullable: true),
                    EncryptionKeyId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    EncryptionIV = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileMimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ImageWidth = table.Column<int>(type: "integer", nullable: true),
                    ImageHeight = table.Column<int>(type: "integer", nullable: true),
                    CodeLanguage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    GiphyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    GifUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReplyToMessageId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ReplyToPreview = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReplyToSenderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReactionsJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ReactionCount = table.Column<int>(type: "integer", nullable: false),
                    MetadataJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatThreads_ThreadId",
                        column: x => x.ThreadId,
                        principalTable: "ChatThreads",
                        principalColumn: "ThreadId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatAttachments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    MessageId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ThreadId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UploaderId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UploaderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    FileSizeDisplay = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    StorageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    StorageContainer = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    StorageBlobName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Width = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<int>(type: "integer", nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    IsEncrypted = table.Column<bool>(type: "boolean", nullable: false),
                    EncryptionKeyId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    EncryptionIV = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsScanned = table.Column<bool>(type: "boolean", nullable: false),
                    ScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsClean = table.Column<bool>(type: "boolean", nullable: true),
                    ScanResult = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DownloadCount = table.Column<int>(type: "integer", nullable: false),
                    LastDownloadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatAttachments_ChatMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_ContentHash",
                table: "ChatAttachments",
                column: "ContentHash");

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_MessageId",
                table: "ChatAttachments",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_ThreadId",
                table: "ChatAttachments",
                column: "ThreadId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_UploaderId",
                table: "ChatAttachments",
                column: "UploaderId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_MessageType",
                table: "ChatMessages",
                column: "MessageType");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId",
                table: "ChatMessages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SentAt",
                table: "ChatMessages",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ThreadId",
                table: "ChatMessages",
                column: "ThreadId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ThreadId_ReadAt",
                table: "ChatMessages",
                columns: new[] { "ThreadId", "ReadAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ThreadId_SentAt",
                table: "ChatMessages",
                columns: new[] { "ThreadId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_LastMessageAt",
                table: "ChatThreads",
                column: "LastMessageAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_MatchId",
                table: "ChatThreads",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_Participant1Id",
                table: "ChatThreads",
                column: "Participant1Id");

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_Participant1Id_LastMessageAt",
                table: "ChatThreads",
                columns: new[] { "Participant1Id", "LastMessageAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_Participant2Id",
                table: "ChatThreads",
                column: "Participant2Id");

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_Participant2Id_LastMessageAt",
                table: "ChatThreads",
                columns: new[] { "Participant2Id", "LastMessageAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_ThreadId",
                table: "ChatThreads",
                column: "ThreadId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatAttachments");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ChatThreads");
        }
    }
}
