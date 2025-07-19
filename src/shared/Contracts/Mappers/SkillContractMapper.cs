//using Contracts.Skill.Requests;
//using Contracts.Skill.Responses;

//namespace Contracts.Mappers;

///// <summary>
///// Mapper for Skill service contracts to CQRS commands/queries
///// This will be implemented in the SkillService to avoid circular dependencies
///// </summary>
//public interface ISkillContractMapper
//{
//    // Create Skill Mapping
//    CreateSkillCommand MapToCommand(CreateSkillRequest request, string? userId = null);
//    CreateSkillResponse MapToResponse(CreateSkillCommandResponse commandResponse);

//    // Update Skill Mapping
//    UpdateSkillCommand MapToCommand(UpdateSkillRequest request, string? userId = null);
//    UpdateSkillResponse MapToResponse(UpdateSkillCommandResponse commandResponse);

//    // Search Skills Mapping
//    SearchSkillsQuery MapToQuery(SearchSkillsRequest request, string? userId = null);
//    SearchSkillsResponse MapToResponse(SearchSkillsQueryResponse queryResponse);

//    // Get Skill Details Mapping
//    GetSkillDetailsQuery MapToQuery(GetSkillDetailsRequest request, string? userId = null);
//    SkillDetailsResponse MapToResponse(GetSkillDetailsQueryResponse queryResponse);

//    // Delete Skill Mapping
//    DeleteSkillCommand MapToCommand(DeleteSkillRequest request, string? userId = null);
//    DeleteSkillResponse MapToResponse(DeleteSkillCommandResponse commandResponse);

//    // Rate Skill Mapping
//    RateSkillCommand MapToCommand(RateSkillRequest request, string? userId = null);
//    RateSkillResponse MapToResponse(RateSkillCommandResponse commandResponse);

//    // Endorse Skill Mapping
//    EndorseSkillCommand MapToCommand(EndorseSkillRequest request, string? userId = null);
//    EndorseSkillResponse MapToResponse(EndorseSkillCommandResponse commandResponse);
//}

//// Placeholder types - these will reference actual CQRS types in SkillService
//public interface CreateSkillCommand { }
//public interface CreateSkillCommandResponse { }
//public interface UpdateSkillCommand { }
//public interface UpdateSkillCommandResponse { }
//public interface SearchSkillsQuery { }
//public interface SearchSkillsQueryResponse { }
//public interface GetSkillDetailsQuery { }
//public interface GetSkillDetailsQueryResponse { }
//public interface DeleteSkillCommand { }
//public interface DeleteSkillCommandResponse { }
//public interface RateSkillCommand { }
//public interface RateSkillCommandResponse { }
//public interface EndorseSkillCommand { }
//public interface EndorseSkillCommandResponse { }