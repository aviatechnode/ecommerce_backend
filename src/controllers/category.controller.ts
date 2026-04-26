import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { Prisma } from "@prisma/client";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";

import {
  generateSlug,
  generateUniqueSlug,
} from "../helpers/generate.slug.helper.js";

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: { products: true };
    };
  };
}>;

type CategoryTreeNode = CategoryWithCount & {
  children: CategoryTreeNode[];
};

//////////////////////////////////////////////////////////
// CREATE CATEGORY
//////////////////////////////////////////////////////////

export const createCategory = async (req: Request, res: Response) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const { name, parentId } = parsed.data;

    // ✅ auto generate slug
    const baseSlug = generateSlug(name);
    const slug = await generateUniqueSlug(baseSlug, prisma.category);

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return res.status(404).json({
          message: "Parent category not found",
        });
      }
    }

    const data: Prisma.CategoryCreateInput = {
      name,
      slug,
    };

    if (parentId) {
      data.parent = { connect: { id: parentId } };
    }

    const category = await prisma.category.create({ data });

    return res.status(201).json({
      message: "Category created",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// GET CATEGORY BY ID
//////////////////////////////////////////////////////////

export const getCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json(category);
  } catch (error) {
    console.error("Get Category Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// GET CATEGORY BY SLUG
//////////////////////////////////////////////////////////

export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json(category);
  } catch (error) {
    console.error("Get Category By Slug Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// GET CATEGORY TREE
//////////////////////////////////////////////////////////

export const getCategoryTree = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const map = new Map<string, CategoryTreeNode>();

    for (const category of categories) {
      map.set(category.id, {
        ...(category as CategoryWithCount),
        children: [],
      });
    }

    const tree: CategoryTreeNode[] = [];

    for (const category of map.values()) {
      if (category.parentId) {
        const parent = map.get(category.parentId);
        if (parent) parent.children.push(category);
      } else {
        tree.push(category);
      }
    }

    return res.json(tree);
  } catch (error) {
    console.error("Get Category Tree Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// GET ALL CATEGORIES
//////////////////////////////////////////////////////////

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return res.json(categories);
  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// UPDATE CATEGORY
//////////////////////////////////////////////////////////

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const parsed = updateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const { name, parentId } = parsed.data;

    const data: Prisma.CategoryUpdateInput = {};

    // ✅ update name + regenerate slug ONLY if name changed
    if (name && name !== existing.name) {
      data.name = name;

      const baseSlug = generateSlug(name);
      data.slug = await generateUniqueSlug(baseSlug, prisma.category);
    }

    if (parentId === id) {
      return res.status(400).json({
        message: "Category cannot be its own parent",
      });
    }

    if (parentId === null) {
      data.parent = { disconnect: true };
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return res.status(404).json({
          message: "Parent category not found",
        });
      }

      data.parent = { connect: { id: parentId } };
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return res.json({
      message: "Category updated",
      category,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//////////////////////////////////////////////////////////
// DELETE CATEGORY
//////////////////////////////////////////////////////////

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (category.children.length > 0) {
      return res.status(400).json({
        message: "Cannot delete category with subcategories",
      });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        message: "Cannot delete category with products",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.json({
      message: "Category deleted",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};