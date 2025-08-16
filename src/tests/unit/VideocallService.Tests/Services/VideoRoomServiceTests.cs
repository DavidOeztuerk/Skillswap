using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using Xunit;
using Bogus;
using MassTransit;

namespace VideocallService.Tests.Services;

public class VideoRoomServiceTests : BaseUnitTest
{
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly Mock<ILogger<VideoRoomService>> _mockLogger;
    private readonly VideoRoomService _videoRoomService;
    private readonly VideoCallDbContext _context;
    private readonly Faker _faker;

    public VideoRoomServiceTests()
    {
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _mockLogger = new Mock<ILogger<VideoRoomService>>();
        _faker = new Faker();

        var options = new DbContextOptionsBuilder<VideoCallDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new VideoCallDbContext(options);

        _videoRoomService = new VideoRoomService(
            _context,
            _mockPublishEndpoint.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task CreateRoomAsync_ShouldCreateNewVideoRoom()
    {
        // Arrange
        var appointmentId = Guid.NewGuid();
        var hostUserId = Guid.NewGuid();
        var roomName = _faker.Lorem.Sentence(3);

        // Act
        var result = await _videoRoomService.CreateRoomAsync(appointmentId, hostUserId, roomName);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AppointmentId.Should().Be(appointmentId);
        result.Data.HostUserId.Should().Be(hostUserId);
        result.Data.RoomName.Should().Be(roomName);
        result.Data.RoomId.Should().NotBeNullOrEmpty();
        result.Data.Status.Should().Be("Created");

        // Verify room was saved to database
        var room = await _context.VideoRooms.FirstOrDefaultAsync(r => r.AppointmentId == appointmentId);
        room.Should().NotBeNull();
        room!.IsActive.Should().BeTrue();
        room.MaxParticipants.Should().Be(2); // Default for 1-on-1 calls
    }

    [Fact]
    public async Task CreateRoomAsync_WithExistingActiveRoom_ShouldReturnFailure()
    {
        // Arrange
        var appointmentId = Guid.NewGuid();
        var hostUserId = Guid.NewGuid();

        // Create existing active room
        var existingRoom = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = appointmentId,
            HostUserId = hostUserId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(existingRoom);
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.CreateRoomAsync(appointmentId, hostUserId, "New Room");

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already has an active room");
        result.Data.Should().BeNull();
    }

    [Fact]
    public async Task JoinRoomAsync_WithValidRoom_ShouldAddParticipant()
    {
        // Arrange
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = Guid.NewGuid(),
            IsActive = true,
            MaxParticipants = 2,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);
        await _context.SaveChangesAsync();

        var participantId = Guid.NewGuid();
        var participantName = _faker.Name.FullName();

        // Act
        var result = await _videoRoomService.JoinRoomAsync(room.RoomId, participantId, participantName);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.ParticipantId.Should().Be(participantId);
        result.Data.RoomId.Should().Be(room.RoomId);
        result.Data.JoinedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        // Verify participant was added
        var participant = await _context.Participants
            .FirstOrDefaultAsync(p => p.UserId == participantId && p.VideoRoomId == room.Id);
        participant.Should().NotBeNull();
        participant!.Name.Should().Be(participantName);
        participant.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task JoinRoomAsync_WithInactiveRoom_ShouldReturnFailure()
    {
        // Arrange
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = Guid.NewGuid(),
            IsActive = false, // Inactive room
            CreatedAt = DateTime.UtcNow,
            EndedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        _context.VideoRooms.Add(room);
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.JoinRoomAsync(room.RoomId, Guid.NewGuid(), "Test User");

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Room is not active");
        result.Data.Should().BeNull();
    }

    [Fact]
    public async Task JoinRoomAsync_WhenRoomIsFull_ShouldReturnFailure()
    {
        // Arrange
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = Guid.NewGuid(),
            IsActive = true,
            MaxParticipants = 2,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);

        // Add max participants
        for (int i = 0; i < room.MaxParticipants; i++)
        {
            _context.Participants.Add(new Participant
            {
                Id = Guid.NewGuid(),
                VideoRoomId = room.Id,
                UserId = Guid.NewGuid(),
                Name = $"User {i}",
                IsActive = true,
                JoinedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.JoinRoomAsync(room.RoomId, Guid.NewGuid(), "New User");

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Room is full");
        result.Data.Should().BeNull();
    }

    [Fact]
    public async Task LeaveRoomAsync_ShouldMarkParticipantAsInactive()
    {
        // Arrange
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = Guid.NewGuid(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);

        var participantId = Guid.NewGuid();
        var participant = new Participant
        {
            Id = Guid.NewGuid(),
            VideoRoomId = room.Id,
            UserId = participantId,
            Name = _faker.Name.FullName(),
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        };
        _context.Participants.Add(participant);
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.LeaveRoomAsync(room.RoomId, participantId);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();

        // Verify participant is marked as inactive
        var updatedParticipant = await _context.Participants.FindAsync(participant.Id);
        updatedParticipant.Should().NotBeNull();
        updatedParticipant!.IsActive.Should().BeFalse();
        updatedParticipant.LeftAt.Should().NotBeNull();
        updatedParticipant.LeftAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task EndRoomAsync_ShouldMarkRoomAsInactive()
    {
        // Arrange
        var hostUserId = Guid.NewGuid();
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = hostUserId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);

        // Add participants
        _context.Participants.Add(new Participant
        {
            Id = Guid.NewGuid(),
            VideoRoomId = room.Id,
            UserId = hostUserId,
            Name = "Host",
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        });
        _context.Participants.Add(new Participant
        {
            Id = Guid.NewGuid(),
            VideoRoomId = room.Id,
            UserId = Guid.NewGuid(),
            Name = "Guest",
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.EndRoomAsync(room.RoomId, hostUserId);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();

        // Verify room is inactive
        var updatedRoom = await _context.VideoRooms.FindAsync(room.Id);
        updatedRoom.Should().NotBeNull();
        updatedRoom!.IsActive.Should().BeFalse();
        updatedRoom.EndedAt.Should().NotBeNull();

        // Verify all participants are marked as inactive
        var participants = await _context.Participants
            .Where(p => p.VideoRoomId == room.Id)
            .ToListAsync();
        participants.Should().AllSatisfy(p =>
        {
            p.IsActive.Should().BeFalse();
            p.LeftAt.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task EndRoomAsync_ByNonHost_ShouldReturnFailure()
    {
        // Arrange
        var hostUserId = Guid.NewGuid();
        var nonHostUserId = Guid.NewGuid();
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = hostUserId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.EndRoomAsync(room.RoomId, nonHostUserId);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Only the host can end the room");
    }

    [Fact]
    public async Task GetRoomDetailsAsync_ShouldReturnRoomWithParticipants()
    {
        // Arrange
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = Guid.NewGuid(),
            RoomName = _faker.Lorem.Sentence(3),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);

        var participant1 = new Participant
        {
            Id = Guid.NewGuid(),
            VideoRoomId = room.Id,
            UserId = room.HostUserId,
            Name = "Host User",
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        };
        var participant2 = new Participant
        {
            Id = Guid.NewGuid(),
            VideoRoomId = room.Id,
            UserId = Guid.NewGuid(),
            Name = "Guest User",
            IsActive = true,
            JoinedAt = DateTime.UtcNow.AddMinutes(1)
        };
        _context.Participants.AddRange(participant1, participant2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.GetRoomDetailsAsync(room.RoomId);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.RoomId.Should().Be(room.RoomId);
        result.Data.RoomName.Should().Be(room.RoomName);
        result.Data.Participants.Should().HaveCount(2);
        result.Data.Participants.Should().Contain(p => p.Name == "Host User");
        result.Data.Participants.Should().Contain(p => p.Name == "Guest User");
    }

    [Fact]
    public async Task StartRecordingAsync_ShouldUpdateRoomRecordingStatus()
    {
        // Arrange
        var room = new VideoRoom
        {
            Id = Guid.NewGuid(),
            RoomId = Guid.NewGuid().ToString(),
            AppointmentId = Guid.NewGuid(),
            HostUserId = Guid.NewGuid(),
            IsActive = true,
            IsRecording = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.VideoRooms.Add(room);
        await _context.SaveChangesAsync();

        // Act
        var result = await _videoRoomService.StartRecordingAsync(room.RoomId, room.HostUserId);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();

        var updatedRoom = await _context.VideoRooms.FindAsync(room.Id);
        updatedRoom.Should().NotBeNull();
        updatedRoom!.IsRecording.Should().BeTrue();
        updatedRoom.RecordingStartedAt.Should().NotBeNull();
        updatedRoom.RecordingStartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    public override void Dispose()
    {
        _context?.Dispose();
        base.Dispose();
    }
}