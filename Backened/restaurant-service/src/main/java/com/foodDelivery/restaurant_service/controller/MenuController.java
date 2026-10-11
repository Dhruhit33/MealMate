package com.foodDelivery.restaurant_service.controller;

import com.foodDelivery.restaurant_service.domain.Category;
import com.foodDelivery.restaurant_service.dto.CategoryRequest;
import com.foodDelivery.restaurant_service.dto.MenuItemRequest;
import com.foodDelivery.restaurant_service.dto.MenuItemResponse;
import com.foodDelivery.restaurant_service.service.JwtService;
import com.foodDelivery.restaurant_service.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/menu")
@RequiredArgsConstructor

public class MenuController {
    private final MenuService menuService;
    private final JwtService jwtService;

    //get full menu
    @GetMapping("/all")
    public ResponseEntity<List<MenuItemResponse>> getAllItem(@PathVariable String restaurantId){
        return ResponseEntity.ok(menuService.getAllItems(restaurantId));
    }
    // get veg item only

    @GetMapping("/veg")
    public ResponseEntity<List<MenuItemResponse>> getVegItem(@PathVariable String restaurantId){
        return ResponseEntity.ok(menuService.getVegItems(restaurantId));
    }

//    getBestSeller
    @GetMapping("/bestseller")
    public ResponseEntity<List<MenuItemResponse>> getBestSeller(@PathVariable String restaurantId){
        return ResponseEntity.ok(menuService.getBestSeller(restaurantId));
    }

    //search item in the menu

    @GetMapping("/search")
    public ResponseEntity<List<MenuItemResponse>> SearchItem(
            @PathVariable String restaurantId ,
            @RequestParam String keyword
    ){
        return  ResponseEntity.ok(menuService.searchItem(restaurantId,keyword));
    }

       //   updateItem
    @PutMapping("/items/{itemId}")
    public ResponseEntity<MenuItemResponse> updateItem(
            @PathVariable String restaurantId,
            @PathVariable String itemId ,
            @RequestHeader("Authorization") String token,
            @RequestBody MenuItemRequest request
            ){
        String userId = extractUserId(token);
        return ResponseEntity.ok(menuService.updateitem(itemId,userId,request));
    }

    //Add item

    @PostMapping("/items")
    public ResponseEntity<MenuItemResponse> addItem(
            @PathVariable String restaurantId ,
            @RequestHeader("Authorization") String token ,
            @Valid @RequestBody MenuItemRequest request
    ){
        String userId = extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(menuService.addItem(restaurantId,userId,request));
    }

    // ─── Helper ────────────────────────────────────────────────────────

    private String extractUserId(String token) {
        return jwtService.extractUserId(token.replace("Bearer ", ""));
    }
    //toggle Item Availability

    @PatchMapping("/items/{itemId}/toggle")
    public ResponseEntity<MenuItemResponse> toggleAvailability(
            @PathVariable String restaurantId,
            @PathVariable String itemId,
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(menuService.toggleAvailability(itemId, userId));
    }

    //Delete Menu Item

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<String> deleteItem(
            @PathVariable String restaurantId ,
            @PathVariable String itemId ,
            @RequestHeader("Authorization") String token
    ) {
        String userId = extractUserId(token);
        menuService.deleteItem(itemId,userId);
        return ResponseEntity.ok("Item deleted");
    }

    //Category Endpoints

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories(@PathVariable String restaurantId ){
        return ResponseEntity.ok(menuService.getCategories(restaurantId));
    }
    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(
            @PathVariable String restaurantId,
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody CategoryRequest request) {

        String userId = extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(menuService.addCategory(restaurantId, userId, request));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<String> deleteCategory(
            @PathVariable String restaurantId,
            @PathVariable String categoryId,
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        menuService.deleteCategory(categoryId, userId);
        return ResponseEntity.ok("Category deleted");
    }

    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> getFullMenu(@PathVariable String restaurantId) {
        return ResponseEntity.ok(menuService.getAllItems(restaurantId));
    }






}
