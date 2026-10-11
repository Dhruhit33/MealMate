package com.foodDelivery.restaurant_service.service;

import com.foodDelivery.restaurant_service.domain.Category;
import com.foodDelivery.restaurant_service.domain.MenuItem;
import com.foodDelivery.restaurant_service.domain.Restaurant;
import com.foodDelivery.restaurant_service.dto.CategoryRequest;
import com.foodDelivery.restaurant_service.dto.MenuItemRequest;
import com.foodDelivery.restaurant_service.dto.MenuItemResponse;
import com.foodDelivery.restaurant_service.repository.CategoryRepo;
import com.foodDelivery.restaurant_service.repository.MenuItemRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepo menuItemRepo;
    private final CategoryRepo categoryRepo;
    private final  RestaurantService restaurantService;

    // -----Add New Item ------//
    @Transactional
    public MenuItemResponse addItem(String restaurantId , String ownerId , MenuItemRequest request){
        Restaurant restaurant = restaurantService.getRestaurantEntity(restaurantId);
        restaurantService.validateOwner(restaurant, ownerId);

        Category category =null ;

        if (request.getCategoryId()!=null){
            category=categoryRepo.findById(request.getCategoryId())
                    .orElseThrow(()-> new RuntimeException("Category not found "));
        }
        MenuItem item = MenuItem.builder()
                .restaurant(restaurant)
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .isVeg(request.getIsVeg() != null ? request.getIsVeg() : true)
                .isBestseller(request.getIsBestseller() != null ? request.getIsBestseller() : false)
                .build();

        item = menuItemRepo.save(item);
        return MenuItemResponse.fromEntity(item);

    }

    //----update the menu ---------//

    @Transactional
    public  MenuItemResponse updateitem(String itemId , String ownerId , MenuItemRequest request){
        MenuItem item = getItemEntity(itemId);
        restaurantService.validateOwner(item.getRestaurant(), ownerId);

        if (request.getName()!=null ) item.setName(request.getName());
        if (request.getDescription()!=null ) item.setDescription(request.getDescription());
        if (request.getPrice()!=null ) item.setPrice(request.getPrice());
        if (request.getImageUrl()!=null) item.setImageUrl(request.getImageUrl());
        if(request.getIsVeg()!=null ) item.setIsVeg(request.getIsVeg());
        if (request.getIsBestseller()!=null ) item.setIsBestseller(request.getIsBestseller());

        if (request.getCategoryId()!=null){
            Category category = categoryRepo.findById(request.getCategoryId())
                    .orElseThrow(()-> new RuntimeException("Category not found"));
            item.setCategory(category);
        }
        item = menuItemRepo.save(item);
        return MenuItemResponse.fromEntity(item);
    }

    //----toggle item availability ------//
    @Transactional
    public MenuItemResponse toggleAvailability(String itemId , String ownerId ){
        MenuItem item = getItemEntity(itemId);
        validateOwner(item.getRestaurant(), ownerId);

        item.setIsAvailable(!item.getIsAvailable());
        item=menuItemRepo.save(item);
        return MenuItemResponse.fromEntity(item);
    }

    //-----delete MenuItem -----//

    @Transactional
    public  void deleteItem(String itemId ,String ownerId){
        MenuItem item = getItemEntity(itemId);
        validateOwner(item.getRestaurant(), ownerId);
        menuItemRepo.delete(item);
    }
    public Map<String, List<MenuItemResponse>> getFullMenu(String restaurantId){
        List<Category> categories = categoryRepo
                .findByRestaurantRestaurantIdOrderByDisplayOrderAsc(restaurantId);
        List<MenuItem> allItem = menuItemRepo
                .findByRestaurantRestaurantIdAndIsAvailableTrue(restaurantId);

        // group item by category name ///
        Map<String , List<MenuItemResponse>> menu = new LinkedHashMap<>();

        for (Category cat : categories){
            List<MenuItemResponse> items = allItem.stream()
                    .filter(item -> item.getCategory() !=null &&
                            item.getCategory().getCategoryId().equals(cat.getCategoryId()))
                    .map(MenuItemResponse::fromEntity)
                    .toList();
            if (!items.isEmpty()){
                menu.put(cat.getName(), items);
            }
        }
        //items without category
        List<MenuItemResponse> uncategorised = allItem.stream()
                .filter(item -> item.getCategory() ==null )
                .map(MenuItemResponse::fromEntity)
                .toList();
        if (!uncategorised.isEmpty()){
            menu.put("other", uncategorised);
        }

        return  menu;


    }

    //-----get all item flat list --------------//


    public  List<MenuItemResponse> getAllItems (String restaurantId ){
        return menuItemRepo.findByRestaurantRestaurantId(restaurantId).stream()
                .map(MenuItemResponse::fromEntity)
                .toList();
    }

    //--------get veg items only -----////

    public List<MenuItemResponse> getVegItems(String restaurantId ){
        return menuItemRepo.findByRestaurantRestaurantIdAndIsVegTrue(restaurantId).stream()
                .map(MenuItemResponse::fromEntity)
                .toList();

    }

    //----------get bestSeller ----------//

    public List<MenuItemResponse> getBestSeller(String restaurantId){
        return menuItemRepo.findByRestaurantRestaurantIdAndIsBestsellerTrue(restaurantId).stream()
                .map(MenuItemResponse::fromEntity)
                .toList();
    }

    /// ------searchItem ------//

    public List<MenuItemResponse> searchItem(String restId , String keyword  ){
        return menuItemRepo.findByNameContainingIgnoreCaseAndRestaurantRestaurantId(keyword, restId).stream()
                .map(MenuItemResponse::fromEntity)
                .toList();
    }

    // ─── Category CRUD ─────────────────────────────────────────────────

    @Transactional
    public Category addCategory(String restaurantId, String ownerId, CategoryRequest request) {
        Restaurant restaurant = restaurantService.getRestaurantEntity(restaurantId);
        validateOwner(restaurant, ownerId);

        Category category = Category.builder()
                .restaurant(restaurant)
                .name(request.getName())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        return categoryRepo.save(category);
    }

    public List<Category> getCategories(String restaurantId) {
        return categoryRepo.findByRestaurantRestaurantIdOrderByDisplayOrderAsc(restaurantId);
    }

    @Transactional
    public void deleteCategory(String categoryId, String ownerId) {
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        validateOwner(category.getRestaurant(), ownerId);
        categoryRepo.delete(category);
    }
    private MenuItem getItemEntity(String itemId) {
        return menuItemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemId));
    }

    private void validateOwner(Restaurant restaurant, String ownerId) {
        if (!restaurant.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("You don't own this restaurant");
        }
    }
}
