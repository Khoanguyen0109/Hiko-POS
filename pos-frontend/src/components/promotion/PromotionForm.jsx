import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDishes } from '../../redux/slices/dishSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { MdClose as XMarkIcon } from 'react-icons/md';
import PropTypes from 'prop-types';
import { FormField, FormSelect, FormTextarea, Button } from '../ui';

const PromotionForm = ({ promotion, onSubmit, onClose }) => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const { items: dishes, loading: dishesLoading } = useSelector(state => state.dishes);
  const { items: categories, loading: categoriesLoading } = useSelector(state => state.categories);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'order_percentage',
    discount: {
      percentage: '',
      fixedAmount: '',
      uniformPrice: ''
    },
    discountType: 'percentage', // For Happy Hour promotions
    applicableItems: 'all_order',
    specificDishes: [],
    categories: [],
    conditions: {
      minOrderAmount: '',
      maxOrderAmount: '',
      timeSlots: [],
      daysOfWeek: [],
      usageLimit: '',
      perCustomerLimit: ''
    },
    isActive: true,
    startDate: '',
    endDate: '',
    priority: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        code: promotion.code || '',
        type: promotion.type || 'order_percentage',
        discount: {
          percentage: promotion.discount?.percentage || '',
          fixedAmount: promotion.discount?.fixedAmount || '',
          uniformPrice: promotion.discount?.uniformPrice || ''
        },
        discountType: promotion.discountType || 'percentage',
        applicableItems: promotion.applicableItems || 'all_order',
        specificDishes: promotion.specificDishes?.map(d => d._id) || [],
        categories: promotion.categories?.map(c => c._id) || [],
        conditions: {
          minOrderAmount: promotion.conditions?.minOrderAmount || '',
          maxOrderAmount: promotion.conditions?.maxOrderAmount || '',
          timeSlots: promotion.conditions?.timeSlots?.map(slot => ({
            start: slot.start || '',
            end: slot.end || ''
          })) || [],
          daysOfWeek: promotion.conditions?.daysOfWeek || [],
          usageLimit: promotion.conditions?.usageLimit || '',
          perCustomerLimit: promotion.conditions?.perCustomerLimit || ''
        },
        isActive: promotion.isActive !== undefined ? promotion.isActive : true,
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        priority: promotion.priority || 0
      });
    }
  }, [promotion]);

  // Fetch dishes and categories from Redux
  useEffect(() => {
    console.log('PromotionForm - Current dishes:', dishes.length, 'categories:', categories.length);
    
    // Only fetch if data is not loaded
    if (dishes.length === 0 && !dishesLoading) {
      dispatch(fetchDishes());
    }
    if (categories.length === 0 && !categoriesLoading) {
      dispatch(fetchCategories());
    }
  }, [dispatch, dishes.length, categories.length, dishesLoading, categoriesLoading]);

  // Handle form input changes
  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      const result = { ...prev };
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return result;
    });

    // Clear related errors
    if (errors[path]) {
      setErrors(prev => ({ ...prev, [path]: null }));
    }
  };

  // Handle array changes (for multi-select)
  const handleArrayChange = (path, value, checked) => {
    setFormData(prev => {
      const current = path.split('.').reduce((obj, key) => obj[key], prev);
      const newArray = checked
        ? [...current, value]
        : current.filter(item => item !== value);
      
      return {
        ...prev,
        [path]: newArray
      };
    });
  };

  // Handle time slot changes
  const handleTimeSlotChange = (index, field, value) => {
    setFormData(prev => {
      // Create a deep copy of timeSlots to avoid read-only property issues
      const newTimeSlots = prev.conditions.timeSlots.map((slot, i) => {
        if (i === index) {
          // Create a new object with the updated field
          return {
            start: slot.start || '',
            end: slot.end || '',
            [field]: value
          };
        }
        // Create a copy of existing slots to avoid read-only issues
        return {
          start: slot.start || '',
          end: slot.end || ''
        };
      });
      
      // If index doesn't exist, add a new slot
      if (!newTimeSlots[index]) {
        newTimeSlots[index] = { start: '', end: '', [field]: value };
      }
      
      return {
        ...prev,
        conditions: {
          ...prev.conditions,
          timeSlots: newTimeSlots
        }
      };
    });
  };

  // Add time slot
  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        timeSlots: [...prev.conditions.timeSlots, { start: '', end: '' }]
      }
    }));
  };

  // Remove time slot
  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        timeSlots: prev.conditions.timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    // Validate discount based on type
    if (formData.type === 'happy_hour') {
      // Validate Happy Hour discount types
      if (!formData.discountType) {
        newErrors.discountType = 'Discount type is required for Happy Hour promotions';
      } else if (formData.discountType === 'percentage') {
        if (!formData.discount.percentage || formData.discount.percentage <= 0 || formData.discount.percentage > 100) {
          newErrors['discount.percentage'] = 'Valid percentage (1-100) is required';
        }
      } else if (formData.discountType === 'fixed_amount') {
        if (!formData.discount.fixedAmount || formData.discount.fixedAmount <= 0) {
          newErrors['discount.fixedAmount'] = 'Valid fixed amount is required';
        }
      } else if (formData.discountType === 'uniform_price') {
        if (!formData.discount.uniformPrice || formData.discount.uniformPrice <= 0) {
          newErrors['discount.uniformPrice'] = 'Valid uniform price is required';
        }
      }
    } else {
      // Non-Happy Hour promotions
      if (formData.type.includes('percentage')) {
        if (!formData.discount.percentage || formData.discount.percentage <= 0 || formData.discount.percentage > 100) {
          newErrors['discount.percentage'] = 'Valid percentage (1-100) is required';
        }
      }

      if (formData.type.includes('fixed')) {
        if (!formData.discount.fixedAmount || formData.discount.fixedAmount <= 0) {
          newErrors['discount.fixedAmount'] = 'Valid fixed amount is required';
        }
      }
    }

    // Validate dates
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate specific items selection
    if (formData.applicableItems === 'specific_dishes' && formData.specificDishes.length === 0) {
      newErrors.specificDishes = 'At least one dish must be selected';
    }

    if (formData.applicableItems === 'categories' && formData.categories.length === 0) {
      newErrors.categories = 'At least one category must be selected';
    }

    // Validate time slots
    formData.conditions.timeSlots.forEach((slot, index) => {
      if (slot.start && slot.end && slot.start >= slot.end) {
        newErrors[`timeSlot.${index}`] = 'End time must be after start time';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Clean up form data
    const submitData = {
      ...formData,
      // Remove empty values
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
      // Clean up discount fields - remove empty strings
      discount: {
        ...(formData.discount.percentage !== '' && formData.discount.percentage !== null && formData.discount.percentage !== undefined ? { percentage: formData.discount.percentage } : {}),
        ...(formData.discount.fixedAmount !== '' && formData.discount.fixedAmount !== null && formData.discount.fixedAmount !== undefined ? { fixedAmount: formData.discount.fixedAmount } : {}),
        ...(formData.discount.uniformPrice !== '' && formData.discount.uniformPrice !== null && formData.discount.uniformPrice !== undefined ? { uniformPrice: formData.discount.uniformPrice } : {})
      },
      conditions: {
        ...formData.conditions,
        minOrderAmount: formData.conditions.minOrderAmount || undefined,
        maxOrderAmount: formData.conditions.maxOrderAmount || undefined,
        usageLimit: formData.conditions.usageLimit || undefined,
        perCustomerLimit: formData.conditions.perCustomerLimit || undefined,
        timeSlots: formData.conditions.timeSlots.filter(slot => slot.start && slot.end)
      }
    };

    // Remove empty arrays
    if (submitData.specificDishes.length === 0) {
      delete submitData.specificDishes;
    }
    if (submitData.categories.length === 0) {
      delete submitData.categories;
    }

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const promotionTypes = [
    { value: 'order_percentage', label: '% Off Entire Order' },
    { value: 'order_fixed', label: 'Fixed Amount Off Order' },
    { value: 'item_percentage', label: '% Off Specific Items' },
    { value: 'item_fixed', label: 'Fixed Amount Off Items' },
    { value: 'happy_hour', label: 'Happy Hour Discount' }
  ];

  const discountTypes = [
    { value: 'percentage', label: 'Percentage Discount' },
    { value: 'fixed_amount', label: 'Fixed Amount Discount' },
    { value: 'uniform_price', label: 'Same Price for All Variants' }
  ];

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#343434] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            {promotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <XMarkIcon size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Promotion Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="e.g., Weekend Special"
              required
            />

            <FormField
              label="Promotion Code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              placeholder="e.g., WEEKEND20"
              helpText="Leave empty to auto-generate"
            />
          </div>

          <FormTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="Describe this promotion..."
          />

          {/* Promotion Type & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label="Promotion Type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              options={promotionTypes}
              error={errors.type}
              required
              placeholder="Select promotion type"
            />

            {/* Happy Hour Discount Type Selection */}
            {formData.type === 'happy_hour' && (
              <FormSelect
                label="Discount Type"
                value={formData.discountType}
                onChange={(e) => handleInputChange('discountType', e.target.value)}
                options={discountTypes}
                error={errors.discountType}
                required
                placeholder="Select discount type"
              />
            )}

            <div>
              <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                {formData.type === 'happy_hour' && formData.discountType === 'uniform_price' 
                  ? 'Uniform Price *' 
                  : 'Discount Value *'
                }
              </label>
              
              {/* Happy Hour Discount Inputs */}
              {formData.type === 'happy_hour' ? (
                <>
                  {formData.discountType === 'percentage' && (
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discount.percentage}
                        onChange={(e) => handleInputChange('discount.percentage', parseFloat(e.target.value) || '')}
                        className={`w-full px-3 py-2 pr-8 bg-[#262626] border rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] ${
                          errors['discount.percentage'] ? 'border-red-500' : 'border-[#343434]'
                        }`}
                        placeholder="25"
                      />
                      <span className="absolute right-3 top-2 text-[#ababab]">%</span>
                    </div>
                  )}
                  
                  {formData.discountType === 'fixed_amount' && (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount.fixedAmount}
                        onChange={(e) => handleInputChange('discount.fixedAmount', parseFloat(e.target.value) || '')}
                        className={`w-full px-3 py-2 pl-8 bg-[#262626] border rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] ${
                          errors['discount.fixedAmount'] ? 'border-red-500' : 'border-[#343434]'
                        }`}
                        placeholder="10000"
                      />
                      <span className="absolute left-3 top-2 text-[#ababab]">₫</span>
                    </div>
                  )}
                  
                  {formData.discountType === 'uniform_price' && (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount.uniformPrice}
                        onChange={(e) => handleInputChange('discount.uniformPrice', parseFloat(e.target.value) || '')}
                        className={`w-full px-3 py-2 pl-8 bg-[#262626] border rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] ${
                          errors['discount.uniformPrice'] ? 'border-red-500' : 'border-[#343434]'
                        }`}
                        placeholder="35000"
                      />
                      <span className="absolute left-3 top-2 text-[#ababab]">₫</span>
                      <div className="text-xs text-[#ababab] mt-1">
                        All variants in selected categories/dishes will be this price
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Non-Happy Hour Discount Inputs */
                <>
                  {formData.type.includes('percentage') ? (
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discount.percentage}
                        onChange={(e) => handleInputChange('discount.percentage', parseFloat(e.target.value) || '')}
                        className={`w-full px-3 py-2 pr-8 bg-[#262626] border rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] ${
                          errors['discount.percentage'] ? 'border-red-500' : 'border-[#343434]'
                        }`}
                        placeholder="10"
                      />
                      <span className="absolute right-3 top-2 text-[#ababab]">%</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount.fixedAmount}
                        onChange={(e) => handleInputChange('discount.fixedAmount', parseFloat(e.target.value) || '')}
                        className={`w-full px-3 py-2 pl-8 bg-[#262626] border rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] ${
                          errors['discount.fixedAmount'] ? 'border-red-500' : 'border-[#343434]'
                        }`}
                        placeholder="5.00"
                      />
                      <span className="absolute left-3 top-2 text-[#ababab]">₫</span>
                    </div>
                  )}
                </>
              )}
              
              {errors['discount.percentage'] && <p className="text-red-500 text-sm mt-1">{errors['discount.percentage']}</p>}
              {errors['discount.fixedAmount'] && <p className="text-red-500 text-sm mt-1">{errors['discount.fixedAmount']}</p>}
              {errors['discount.uniformPrice'] && <p className="text-red-500 text-sm mt-1">{errors['discount.uniformPrice']}</p>}
            </div>
          </div>

          {/* Applicable Items */}
          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              Apply To
            </label>
            <select
              value={formData.applicableItems}
              onChange={(e) => handleInputChange('applicableItems', e.target.value)}
              className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
            >
              <option value="all_order">Entire Order</option>
              <option value="specific_dishes">Specific Dishes</option>
              <option value="categories">Categories</option>
            </select>
          </div>

          {/* Specific Dishes Selection */}
          {formData.applicableItems === 'specific_dishes' && (
            <div>
              <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                Select Dishes *
              </label>
              <div className="max-h-48 overflow-y-auto bg-[#262626] border border-[#343434] rounded-md p-3">
                {dishesLoading ? (
                  <div className="text-[#ababab] text-sm py-4 text-center">Loading dishes...</div>
                ) : dishes.length === 0 ? (
                  <div className="text-[#ababab] text-sm py-4 text-center">No dishes available</div>
                ) : (
                  dishes.map(dish => (
                    <label key={dish._id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.specificDishes.includes(dish._id)}
                        onChange={(e) => handleArrayChange('specificDishes', dish._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-[#f5f5f5]">{dish.name} - {dish.price ? `${dish.price}₫` : 'No price'}</span>
                    </label>
                  ))
                )}
              </div>
              {errors.specificDishes && <p className="text-red-500 text-sm mt-1">{errors.specificDishes}</p>}
            </div>
          )}

          {/* Categories Selection */}
          {formData.applicableItems === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                Select Categories *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categoriesLoading ? (
                  <div className="col-span-full text-[#ababab] text-sm py-4 text-center">Loading categories...</div>
                ) : categories.length === 0 ? (
                  <div className="col-span-full text-[#ababab] text-sm py-4 text-center">No categories available</div>
                ) : (
                  categories.map(category => (
                    <label key={category._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category._id)}
                        onChange={(e) => handleArrayChange('categories', category._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-[#f5f5f5]">{category.name}</span>
                    </label>
                  ))
                )}
              </div>
              {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
            </div>
          )}

          {/* Conditions */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-[#f5f5f5] mb-4">Conditions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Minimum Order Amount (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.conditions.minOrderAmount}
                  onChange={(e) => handleInputChange('conditions.minOrderAmount', parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Maximum Order Amount (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.conditions.maxOrderAmount}
                  onChange={(e) => handleInputChange('conditions.maxOrderAmount', parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100]"
                  placeholder="No limit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.conditions.usageLimit}
                  onChange={(e) => handleInputChange('conditions.usageLimit', parseInt(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100]"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Per Customer Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.conditions.perCustomerLimit}
                  onChange={(e) => handleInputChange('conditions.perCustomerLimit', parseInt(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100]"
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              Active Days (leave empty for all days)
            </label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map(day => (
                <label key={day} className="flex items-center space-x-2 p-2 bg-[#262626] border border-[#343434] rounded-md hover:bg-[#2a2a2a] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.conditions.daysOfWeek.includes(day)}
                    onChange={(e) => handleArrayChange('conditions.daysOfWeek', day, e.target.checked)}
                    className="rounded border-[#343434] bg-[#262626] text-[#f6b100] focus:ring-[#f6b100] focus:ring-2"
                  />
                  <span className="text-sm capitalize text-[#f5f5f5]">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#f5f5f5]">
                Time Slots (for Happy Hour)
              </label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="text-[#f6b100] text-sm hover:text-[#f6b100]/80 font-medium"
              >
                + Add Time Slot
              </button>
            </div>
            
            {formData.conditions.timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2 p-3 bg-[#262626] border border-[#343434] rounded-md">
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
                <span className="text-[#ababab]">to</span>
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium px-2 py-1 hover:bg-red-900/20 rounded"
                >
                  Remove
                </button>
                {errors[`timeSlot.${index}`] && (
                  <p className="text-red-500 text-sm">{errors[`timeSlot.${index}`]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 bg-[#262626] border rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] ${
                  errors.startDate ? 'border-red-500' : 'border-[#343434]'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 bg-[#262626] border rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] ${
                  errors.endDate ? 'border-red-500' : 'border-[#343434]'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 p-3 bg-[#262626] border border-[#343434] rounded-md hover:bg-[#2a2a2a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-[#343434] bg-[#262626] text-[#f6b100] focus:ring-[#f6b100] focus:ring-2"
                />
                <span className="text-sm font-medium text-[#f5f5f5]">Active</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                Priority (higher = applied first)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-[#343434]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#ababab] bg-[#262626] border border-[#343434] rounded-md hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-md hover:bg-[#f6b100]/90 disabled:bg-[#f6b100]/50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (promotion ? 'Update' : 'Create')} Promotion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PromotionForm.propTypes = {
  promotion: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    code: PropTypes.string,
    type: PropTypes.string,
    discount: PropTypes.shape({
      percentage: PropTypes.number,
      fixedAmount: PropTypes.number,
      uniformPrice: PropTypes.number
    }),
    discountType: PropTypes.string,
    applicableItems: PropTypes.string,
    specificDishes: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string
    })),
    categories: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string
    })),
    conditions: PropTypes.shape({
      minOrderAmount: PropTypes.number,
      maxOrderAmount: PropTypes.number,
      timeSlots: PropTypes.arrayOf(PropTypes.shape({
        start: PropTypes.string,
        end: PropTypes.string
      })),
      daysOfWeek: PropTypes.arrayOf(PropTypes.string),
      usageLimit: PropTypes.number,
      perCustomerLimit: PropTypes.number
    }),
    isActive: PropTypes.bool,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    priority: PropTypes.number
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default PromotionForm;

