using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackedHub.Api;
using StackedHub.Api.Services;
using StackedHub.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.Converters.Add(new OrderStatusJsonConverter());
    options.JsonSerializerOptions.Converters.Add(new OrderChannelJsonConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StackedHub API",
        Version = "v1",
        Description = "Role 2 back-end for INSY7315 Phase 2. Matches src/lib/api-client.ts: JWT auth, menu, orders, inventory, customers, promotions, reports, audit logs, and Gemini meal recommendations with a grounded fallback."
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddStackedHubData(builder.Configuration);
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<AssistantService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddHttpClient<RecommendationService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "stackedhub-dev-key-change-in-production-32!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Run();

public partial class Program;
