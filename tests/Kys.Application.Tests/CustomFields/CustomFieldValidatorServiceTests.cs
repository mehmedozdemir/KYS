using FluentAssertions;
using Kys.Application.Services;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Repositories;
using NSubstitute;

namespace Kys.Application.Tests.CustomFields;

public sealed class CustomFieldValidatorServiceTests
{
    private readonly ICustomFieldDefinitionRepository _repository = Substitute.For<ICustomFieldDefinitionRepository>();
    private readonly CustomFieldValidatorService _service;

    public CustomFieldValidatorServiceTests()
    {
        _service = new CustomFieldValidatorService(_repository);
    }

    [Fact]
    public async Task Validate_RequiredFieldMissing_ReturnsError()
    {
        SetupDefinitions([RequiredTextField("company_name", "Şirket Adı")]);

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, [], CancellationToken.None);

        errors.Should().HaveCount(1);
        errors[0].FieldKey.Should().Be("company_name");
        errors[0].Message.Should().Contain("zorunlu");
    }

    [Fact]
    public async Task Validate_RequiredFieldPresent_ReturnsNoError()
    {
        SetupDefinitions([RequiredTextField("company_name", "Şirket Adı")]);
        var fields = new Dictionary<string, object?> { ["company_name"] = "ACME Corp" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, fields, CancellationToken.None);

        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Validate_SelectFieldInvalidOption_ReturnsError()
    {
        SetupDefinitions([SelectField("region", "Bölge", ["Anadolu", "Marmara", "Ege"])]);
        var fields = new Dictionary<string, object?> { ["region"] = "Akdeniz" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, fields, CancellationToken.None);

        errors.Should().HaveCount(1);
        errors[0].FieldKey.Should().Be("region");
        errors[0].Message.Should().Contain("geçersiz seçenek");
    }

    [Fact]
    public async Task Validate_SelectFieldValidOption_ReturnsNoError()
    {
        SetupDefinitions([SelectField("region", "Bölge", ["Anadolu", "Marmara"])]);
        var fields = new Dictionary<string, object?> { ["region"] = "Marmara" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, fields, CancellationToken.None);

        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Validate_TextFieldExceedsMaxLength_ReturnsError()
    {
        SetupDefinitions([TextFieldWithRules("notes", "Notlar", new() { ["max_length"] = "10" })]);
        var fields = new Dictionary<string, object?> { ["notes"] = "Bu metin çok uzun bir içerik taşıyor" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Product, fields, CancellationToken.None);

        errors.Should().HaveCount(1);
        errors[0].FieldKey.Should().Be("notes");
    }

    [Fact]
    public async Task Validate_NumberFieldOutOfRange_ReturnsError()
    {
        SetupDefinitions([NumberFieldWithRules("score", "Puan", new() { ["min"] = "0", ["max"] = "100" })]);
        var fields = new Dictionary<string, object?> { ["score"] = "150" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, fields, CancellationToken.None);

        errors.Should().HaveCount(1);
        errors[0].FieldKey.Should().Be("score");
        errors[0].Message.Should().Contain("en fazla");
    }

    [Fact]
    public async Task Validate_InvalidDateField_ReturnsError()
    {
        SetupDefinitions([DateField("contract_end", "Sözleşme Bitişi")]);
        var fields = new Dictionary<string, object?> { ["contract_end"] = "not-a-date" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, fields, CancellationToken.None);

        errors.Should().HaveCount(1);
        errors[0].FieldKey.Should().Be("contract_end");
    }

    [Fact]
    public async Task Validate_InvalidEmailField_ReturnsError()
    {
        SetupDefinitions([EmailField("support_email", "Destek E-posta")]);
        var fields = new Dictionary<string, object?> { ["support_email"] = "not-an-email" };

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, fields, CancellationToken.None);

        errors.Should().HaveCount(1);
        errors[0].FieldKey.Should().Be("support_email");
    }

    [Fact]
    public async Task Validate_OptionalFieldAbsent_ReturnsNoError()
    {
        SetupDefinitions([OptionalTextField("notes", "Notlar")]);

        var errors = await _service.ValidateAsync(CustomFieldEntityType.Customer, [], CancellationToken.None);

        errors.Should().BeEmpty();
    }

    private void SetupDefinitions(IReadOnlyList<CustomFieldDefinition> definitions)
        => _repository.GetByEntityTypeAsync(Arg.Any<CustomFieldEntityType>(), Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(definitions);

    private static CustomFieldDefinition RequiredTextField(string key, string displayName) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Text, IsRequired = true, IsActive = true
    };

    private static CustomFieldDefinition OptionalTextField(string key, string displayName) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Text, IsRequired = false, IsActive = true
    };

    private static CustomFieldDefinition SelectField(string key, string displayName, List<string> options) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Select, IsRequired = false, IsActive = true,
        SelectOptions = options
    };

    private static CustomFieldDefinition TextFieldWithRules(string key, string displayName, Dictionary<string, object?> rules) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Text, IsRequired = false, IsActive = true,
        ValidationRules = rules
    };

    private static CustomFieldDefinition NumberFieldWithRules(string key, string displayName, Dictionary<string, object?> rules) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Number, IsRequired = false, IsActive = true,
        ValidationRules = rules
    };

    private static CustomFieldDefinition DateField(string key, string displayName) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Date, IsRequired = false, IsActive = true
    };

    private static CustomFieldDefinition EmailField(string key, string displayName) => new()
    {
        FieldKey = key, DisplayName = displayName,
        FieldType = CustomFieldType.Email, IsRequired = false, IsActive = true
    };
}
