package com.foodDelivery.user_service.service;

import com.foodDelivery.user_service.domain.Address;
import com.foodDelivery.user_service.domain.User;
import com.foodDelivery.user_service.dto.AddressRequest;
import com.foodDelivery.user_service.exception.ResourceNotFoundException;
import com.foodDelivery.user_service.repository.AddressRepository;
import com.foodDelivery.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;

    public User getProfile(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    public User updateProfile(String userId, String name, String phone) {
        User user = getProfile(userId);
        if (name != null) user.setName(name);
        if (phone != null) user.setPhone(phone);
        return userRepository.save(user);
    }

    public List<Address> getAddresses(String userId) {
        return addressRepository.findByUserUserId(userId);
    }

    public Address addAddress(String userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Address address = Address.builder()
                .user(user)
                .label(request.getLabel())
                .street(request.getStreet())
                .city(request.getCity())
                .pincode(request.getPincode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(request.isDefault())
                .build();
        return addressRepository.save(address);
    }

    public Address updateAddress(String addressId, Address updated) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));
        if (updated.getLabel() != null) address.setLabel(updated.getLabel());
        if (updated.getStreet() != null) address.setStreet(updated.getStreet());
        if (updated.getCity() != null) address.setCity(updated.getCity());
        if (updated.getPincode() != null) address.setPincode(updated.getPincode());
        if (updated.getLatitude() != null) address.setLatitude(updated.getLatitude());
        if (updated.getLongitude() != null) address.setLongitude(updated.getLongitude());
        return addressRepository.save(address);
    }

    public void deleteAddress(String addressId) {
        if (!addressRepository.existsById(addressId)) {
            throw new ResourceNotFoundException("Address not found: " + addressId);
        }
        addressRepository.deleteById(addressId);
    }
}