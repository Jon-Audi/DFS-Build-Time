
"use client";

import { useState } from "react";
import { runFlow } from "@genkit-ai/next/client";
import { enhanceMaterialSearch } from "@/ai/flows/enhance-material-search";
import { suggestMaterials } from "@/ai/flows/suggest-materials";
import type { Material } from "@/lib/types";
import { mockMaterials, mockTaskTypes } from "@/lib/data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, PackagePlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

export function MaterialSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<string>(mockTaskTypes[0].name);

  const handleSearch = async (term: string) => {
    setLoading(true);
    try {
      const { enhancedSearchTerm } = await runFlow(enhanceMaterialSearch, {
        searchTerm: term,
        taskType: selectedTask,
        materialsPreviouslyUsed: "6ft Cedar Picket, 8ft Pressure-Treated Post 4x4",
      });

      toast({ title: "AI Search Enhancement", description: `Searching for: ${enhancedSearchTerm}` });

      const searchTerms = enhancedSearchTerm.toLowerCase().split(',').map(t => t.trim());
      const filteredMaterials = mockMaterials.filter((material) =>
        searchTerms.some(st => material.name.toLowerCase().includes(st))
      );
      setMaterials(filteredMaterials);

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to enhance search." });
      const filteredMaterials = mockMaterials.filter((material) =>
        material.name.toLowerCase().includes(term.toLowerCase())
      );
      setMaterials(filteredMaterials);
    }
    setLoading(false);
  };
  
  const handleSuggest = async () => {
    setLoading(true);
    try {
      const { suggestedMaterials: suggestions } = await runFlow(suggestMaterials, {
        jobDescription: "Installing a 6ft tall privacy fence in a residential backyard with rocky soil.",
        taskType: selectedTask,
        previouslyUsedMaterials: ["6ft Cedar Picket", "8ft Cedar Rail 2x4"]
      });

      toast({ title: "AI Material Suggestions", description: `Found ${suggestions.length} relevant materials.` });

      const suggestedLower = suggestions.map(s => s.toLowerCase());
      const filteredMaterials = mockMaterials.filter((material) =>
        suggestedLower.includes(material.name.toLowerCase())
      );
      setMaterials(filteredMaterials);

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to get suggestions." });
    }
    setLoading(false);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Material Catalog</CardTitle>
        <CardDescription>
          Search for materials or use AI to get suggestions for your job.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow space-y-2">
            <Label htmlFor="search-materials">Search Materials</Label>
            <div className="flex gap-2">
              <Input
                id="search-materials"
                placeholder="e.g., cedar picket, 4x4 post..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
                disabled={loading}
              />
              <Button onClick={() => handleSearch(searchTerm)} disabled={loading}>
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-type">For Task Type</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger id="task-type">
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {mockTaskTypes.map((task) => (
                  <SelectItem key={task.id} value={task.name}>
                    {task.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSuggest} disabled={loading} variant="outline" className="w-full md:w-auto">
              <Sparkles className="mr-2 h-4 w-4 text-accent" /> AI Suggest
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="p-4">
                      <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{material.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(material.cost)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon">
                        <PackagePlus className="h-4 w-4" />
                        <span className="sr-only">Add to job</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No materials found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
