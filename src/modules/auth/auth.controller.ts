import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthGuard } from "../../common/guards/auth.guard";
import { AuthService } from "./auth.service";
import { LoginRequestDto, RefreshTokenRequestDto, RegisterRequestDto } from "./dto/auth.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Create a user and issue access and refresh tokens." })
  @ApiBody({ type: RegisterRequestDto })
  @ApiOkResponse({ description: "User registered successfully." })
  register(@Body() dto: RegisterRequestDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Authenticate a user and issue access and refresh tokens." })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ description: "User authenticated successfully." })
  login(@Body() dto: LoginRequestDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Rotate refresh token and issue a fresh access token." })
  @ApiBody({ type: RefreshTokenRequestDto })
  refresh(@Body() dto: RefreshTokenRequestDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  me(@Req() request: Request) {
    return request.user;
  }

  @Post("logout")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@Req() request: Request) {
    return this.auth.logout(request.user!.id);
  }
}

