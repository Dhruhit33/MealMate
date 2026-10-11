package com.foodDelivery.user_service.controller;

import com.foodDelivery.user_service.domain.Address;
import com.foodDelivery.user_service.dto.AddressRequest;
import com.foodDelivery.user_service.service.ProfileService;
import com.foodDelivery.user_service.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final ProfileService profileService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<Address>> getAddresses(@RequestHeader("Authorization") String token) {
        String userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(profileService.getAddresses(userId));
    }

    @PostMapping
    public ResponseEntity<Address> addAddress(
            @RequestHeader("Authorization") String token,
            @RequestBody AddressRequest address) {
        String userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(profileService.addAddress(userId, address));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<Address> updateAddress(
            @PathVariable String addressId,
            @RequestBody Address address) {
        return ResponseEntity.ok(profileService.updateAddress(addressId, address));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<String> deleteAddress(@PathVariable String addressId) {
        profileService.deleteAddress(addressId);
        return ResponseEntity.ok("Address deleted");
    }
}