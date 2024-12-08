"use client";

import { useContext } from 'react';
import { AuthContext } from './components/AuthContext';
import { useAuth, AuthProvider } from './components/AuthContext';
import Auth from './components/Auth';
import { getAuth } from 'firebase/auth';
import React, { useState, useCallback, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, getDocs, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft, Trash2, Edit2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const firebaseConfig = {
  apiKey: "AIzaSyBnFSTAY9jZT6jKAZzXMENECNG3gzgumsg",
  authDomain: "suppa-time.firebaseapp.com",
  projectId: "suppa-time",
  storageBucket: "suppa-time.firebasestorage.app",
  messagingSenderId: "848567631853",
  appId: "1:848567631853:web:9b56dc947a3ed7573671e4",
  measurementId: "G-FG2ZZZLEC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


const MealSuggester = () => {
  const [view, setView] = useState('main');
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [customMeals, setCustomMeals] = useState([]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Replace the hardcoded initialIngredients with a state
const [ingredients, setIngredients] = useState([]);

// Add this useEffect to load ingredients from Firebase
useEffect(() => {
  const loadIngredients = async () => {
    try {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const ingredientsRef = collection(db, 'users', userId, 'ingredients');
      const querySnapshot = await getDocs(query(ingredientsRef));
      const loadedIngredients = [];
      querySnapshot.forEach((doc) => {
        loadedIngredients.push({ id: doc.id, name: doc.data().name });
      });
      setIngredients(loadedIngredients.map(ing => ing.name).sort());
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  loadIngredients();
}, [auth.currentUser]);

// Add ingredient operations
const ingredientOperations = {
  addIngredient: async (newIngredient) => {
    try {
      const userId = auth.currentUser.uid;
      const userIngredientsRef = collection(db, 'users', userId, 'ingredients');
      await addDoc(userIngredientsRef, { name: newIngredient });
      // Reload ingredients instead of just updating state
      const querySnapshot = await getDocs(query(userIngredientsRef));
      const loadedIngredients = [];
      querySnapshot.forEach((doc) => {
        loadedIngredients.push({ id: doc.id, name: doc.data().name });
      });
      setIngredients(loadedIngredients.map(ing => ing.name).sort());
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  },

  deleteIngredient: async (ingredientToDelete) => {
    try {
      const userId = auth.currentUser.uid;
      const mealsWithIngredient = customMeals.filter(
        meal => meal.mainIngredient === ingredientToDelete
      );

      if (mealsWithIngredient.length > 0) {
        return {
          success: false,
          message: `Cannot delete this ingredient because it's used in ${mealsWithIngredient.length} meal(s)`
        };
      }

      const ingredientsRef = collection(db, 'users', userId, 'ingredients');
      const q = query(ingredientsRef);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        if (doc.data().name === ingredientToDelete) {
          await deleteDoc(doc.ref);
        }
      });
      
      setIngredients(prev => prev.filter(ing => ing !== ingredientToDelete).sort());
      return { success: true };
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      return { success: false, message: 'Error deleting ingredient' };
    }
  }
};

useEffect(() => {
  const loadMeals = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userId = auth.currentUser.uid;
      const mealsRef = collection(db, 'users', userId, 'meals');
      const querySnapshot = await getDocs(query(mealsRef));
      const loadedMeals = [];
      querySnapshot.forEach((doc) => {
        loadedMeals.push({ id: doc.id, ...doc.data() });
      });
      setCustomMeals(loadedMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadMeals();
}, [auth.currentUser]);


  const getMealSuggestions = useCallback((ingredient) => {
    return customMeals.filter(meal => meal.mainIngredient === ingredient);
  }, [customMeals]);

  const mealOperations = {
    addMeal: async (newMeal) => {
      try {
        const userId = auth.currentUser.uid;
        const userMealsRef = collection(db, 'users', userId, 'meals');
        const docRef = await addDoc(userMealsRef, newMeal);
        setCustomMeals(prevMeals => [...prevMeals, { ...newMeal, id: docRef.id }]);
      } catch (error) {
        console.error('Error adding meal:', error);
      }
    },
      
    updateMeal: async (updatedMeal) => {
      try {
        const userId = auth.currentUser.uid;
        const { id, ...mealData } = updatedMeal;
        const mealRef = doc(db, 'users', userId, 'meals', id);
        await updateDoc(mealRef, mealData);
        setCustomMeals(prevMeals => 
          prevMeals.map(meal => 
            meal.id === id ? updatedMeal : meal
          )
        );
      } catch (error) {
        console.error('Error updating meal:', error);
      }
    },
      
    deleteMeal: async (mealId) => {
      try {
        const userId = auth.currentUser.uid;
        const mealRef = doc(db, 'users', userId, 'meals', mealId);
        await deleteDoc(mealRef);
        setCustomMeals(prevMeals => 
          prevMeals.filter(meal => meal.id !== mealId)
        );
      } catch (error) {
        console.error('Error deleting meal:', error);
      }
    }
  };

  const MealForm = ({ initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
      name: '',
      mainIngredient: '',
      ingredients: [],
      notes: '',
      prepTime: '',
      cookingTime: '',
      servings: ''
    });
  
    const [newIngredient, setNewIngredient] = useState({ item: '', measurement: '' });
  
    const addIngredient = () => {
      if (newIngredient.item.trim()) {
        setFormData({
          ...formData,
          ingredients: [...formData.ingredients, newIngredient]
        });
        setNewIngredient({ item: '', measurement: '' });
      }
    };
  
    const removeIngredient = (index) => {
      setFormData({
        ...formData,
        ingredients: formData.ingredients.filter((_, i) => i !== index)
      });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (initialData) {
        await mealOperations.updateMeal({ ...formData, id: initialData.id });
      } else {
        await mealOperations.addMeal(formData);
      }
  
      setFormData({
        name: '',
        mainIngredient: '',
        ingredients: [],
        notes: '',
        prepTime: '',
        cookingTime: '',
        servings: ''
      });
      setView('main');
      setEditingMeal(null);
    };
  
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setView('main');
              setEditingMeal(null);
            }}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Meal' : 'Add New Meal'}
          </h2>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Meal Name*
              </label>
              <input
                type="text"
                required
                className="w-full p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
  
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Main Ingredient*
              </label>
              <select
                required
                className="w-full p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.mainIngredient}
                onChange={(e) => {
                  if (e.target.value === 'add_new') {
                    const newIngredient = prompt('Enter new ingredient name:');
                    if (newIngredient?.trim()) {
                      // Check for duplicates (case-insensitive)
                      const isDuplicate = ingredients.some(
                        ing => ing.toLowerCase() === newIngredient.trim().toLowerCase()
                      );
                      
                      if (isDuplicate) {
                        alert('This ingredient already exists!');
                        return;
                      }
                      
                      // Check for valid name (letters, numbers, spaces only)
                      const validName = /^[a-zA-Z0-9\s]+$/.test(newIngredient.trim());
                      if (!validName) {
                        alert('Ingredient name can only contain letters, numbers, and spaces');
                        return;
                      }
                
                      ingredientOperations.addIngredient(newIngredient.trim());
                      setFormData({...formData, mainIngredient: newIngredient.trim()});
                    }
                  } else {
                    setFormData({...formData, mainIngredient: e.target.value});
                  }
                }}
              >
                <option value="">Select main ingredient</option>
                {ingredients.map((ing) => (
                  <option key={ing} value={ing}>{ing}</option>
                ))}
                <option value="add_new" className="font-semibold text-emerald-600">+ Add New Ingredient</option>
              </select>
            </div>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Prep Time
              </label>
              <input
                type="text"
                className="w-full p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 15 mins"
                value={formData.prepTime}
                onChange={(e) => setFormData({...formData, prepTime: e.target.value})}
              />
            </div>
  
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Cooking Time
              </label>
              <input
                type="text"
                className="w-full p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 30 mins"
                value={formData.cookingTime}
                onChange={(e) => setFormData({...formData, cookingTime: e.target.value})}
              />
            </div>
  
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Servings
              </label>
              <input
                type="text"
                className="w-full p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 4"
                value={formData.servings}
                onChange={(e) => setFormData({...formData, servings: e.target.value})}
              />
            </div>
          </div>
  
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Ingredients
            </label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ingredient</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Measurement</th>
                    <th className="px-4 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.ingredients.map((ing, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{ing.item}</td>
                      <td className="px-4 py-2">{ing.measurement}</td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="Ingredient"
                        value={newIngredient.item}
                        onChange={(e) => setNewIngredient({...newIngredient, item: e.target.value})}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="Amount"
                        value={newIngredient.measurement}
                        onChange={(e) => setNewIngredient({...newIngredient, measurement: e.target.value})}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={addIngredient}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Recipe Notes
            </label>
            <textarea
              className="w-full p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="4"
              placeholder="Enter cooking instructions and any additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
  
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {initialData ? 'Save Changes' : 'Add Meal'}
          </Button>
        </form>
      </div>
    );
    
  };

  const DeleteConfirmDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="bg-white">
  <AlertDialogHeader>
    <AlertDialogTitle className="text-blue-900">Delete Meal</AlertDialogTitle>
    <AlertDialogDescription className="text-gray-600">
      Are you sure you want to delete "{selectedMeal?.name}"? This action cannot be undone.
    </AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter className="gap-2">
    <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700">
      Cancel
    </AlertDialogCancel>
    <AlertDialogAction
      className="bg-red-600 hover:bg-red-700 text-white"
      onClick={async () => {
        await mealOperations.deleteMeal(selectedMeal.id);
        setShowDeleteDialog(false);
      }}
    >
      Delete
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
    </AlertDialog>
  );

  const RecipeDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-white to-blue-50">
  <DialogHeader>
    <DialogTitle className="text-blue-900">{selectedMeal?.name}</DialogTitle>
  </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Main Ingredient</h4>
            <p className="text-gray-700">{selectedMeal?.mainIngredient}</p>
          </div>
  
          {selectedMeal?.ingredients && selectedMeal.ingredients.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Ingredients</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ingredient</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMeal.ingredients.map((ing, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-gray-700">{ing.item}</td>
                        <td className="px-4 py-2 text-gray-700">{ing.measurement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
  
          {(selectedMeal?.prepTime || selectedMeal?.cookingTime || selectedMeal?.servings) && (
            <div className="grid grid-cols-3 gap-4">
              {selectedMeal?.prepTime && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Prep Time</h4>
                  <p className="text-gray-700">{selectedMeal.prepTime}</p>
                </div>
              )}
              {selectedMeal?.cookingTime && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Cook Time</h4>
                  <p className="text-gray-700">{selectedMeal.cookingTime}</p>
                </div>
              )}
              {selectedMeal?.servings && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Servings</h4>
                  <p className="text-gray-700">{selectedMeal.servings}</p>
                </div>
              )}
            </div>
          )}
  
          {selectedMeal?.notes && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Recipe Notes</h4>
              <p className="text-gray-700 whitespace-pre-line">{selectedMeal.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AuthProvider>
      {!auth.currentUser ? (
        <Auth />
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
          <div className="max-w-md mx-auto">
            <Card className="w-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                {view === 'main' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <h2 className="text-2xl font-bold text-blue-900">What's for Dinner?</h2>
                      <Button 
                        onClick={() => setView('add')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-200"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Add New Meal</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
   
                    <div className="space-y-4">
                      <div className="flex gap-2 items-start">
                        <select
                          value={selectedIngredient}
                          onChange={(e) => setSelectedIngredient(e.target.value)}
                          className="flex-1 p-3 border border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                        >
                          <option value="">Select a main ingredient</option>
                          {ingredients.map((ingredient) => (
                            <option key={ingredient} value={ingredient}>
                              {ingredient}
                            </option>
                          ))}
                        </select>
                        <Button
  onClick={() => {
    const newIngredient = prompt('Enter new ingredient name:');
    if (newIngredient?.trim()) {
      const isDuplicate = ingredients.some(
        ing => ing.toLowerCase() === newIngredient.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        alert('This ingredient already exists!');
        return;
      }
      
      const validName = /^[a-zA-Z0-9\s]+$/.test(newIngredient.trim());
      if (!validName) {
        alert('Ingredient name can only contain letters, numbers, and spaces');
        return;
      }

      ingredientOperations.addIngredient(newIngredient.trim());
    }
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors duration-200"
>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        {selectedIngredient && (
                          <Button
                            onClick={async () => {
                              const result = await ingredientOperations.deleteIngredient(selectedIngredient);
                              if (!result.success) {
                                alert(result.message);
                              } else {
                                setSelectedIngredient('');
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
   
                      {selectedIngredient && (
                        <div className="bg-white rounded-lg border border-blue-100 p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-blue-900">
                              Meal suggestions with {selectedIngredient}:
                            </h3>
                            <Button
                              onClick={() => {
                                const meals = getMealSuggestions(selectedIngredient);
                                if (meals.length > 0) {
                                  const randomMeal = meals[Math.floor(Math.random() * meals.length)];
                                  setSelectedMeal(randomMeal);
                                  setShowDetailsDialog(true);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                                <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                                <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                              </svg>
                              Surprise Me!
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {isLoading ? (
                              <div className="text-center py-4 text-gray-500">Loading meals...</div>
                            ) : getMealSuggestions(selectedIngredient).length === 0 ? (
                              <div className="text-center py-4 text-gray-500">No meals found with this ingredient</div>
                            ) : (
                              getMealSuggestions(selectedIngredient).map((meal) => (
                                <div 
                                  key={meal.id} 
                                  className="flex justify-between items-center p-3 hover:bg-blue-50 rounded-md border border-blue-100 transition-all duration-200"
                                >
                                  <span className="text-blue-900">{meal.name}</span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedMeal(meal);
                                        setShowDetailsDialog(true);
                                      }}
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setEditingMeal(meal);
                                        setView('edit');
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                      onClick={() => {
                                        setSelectedMeal(meal);
                                        setShowDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {view === 'add' && <MealForm />}
                {view === 'edit' && <MealForm initialData={editingMeal} />}
                <DeleteConfirmDialog />
                <RecipeDetailsDialog />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AuthProvider>
   );}

export default MealSuggester;