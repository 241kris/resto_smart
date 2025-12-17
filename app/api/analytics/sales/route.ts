// ---------------------------------------
//  API Route: /api/analytics/sales
//  Récupère les statistiques de ventes (commandes PAID)
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
);

/**
 * GET /api/analytics/sales?period=7days|Xmonths
 * Récupère les statistiques de ventes pour la période spécifiée
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    // Récupérer l'établissement de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    });

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les paramètres de la requête
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7days';

    let startDate: Date;
    let labels: string[];
    let groupBy: 'day' | 'month' = 'day';

    // Déterminer la période et les labels
    if (period === '7days') {
      startDate = startOfDay(subDays(new Date(), 6)); // 7 jours incluant aujourd'hui
      labels = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
      }
      groupBy = 'day';
    } else if (period.endsWith('months')) {
      const monthsCount = parseInt(period.replace('months', ''));
      if (isNaN(monthsCount) || monthsCount < 1 || monthsCount > 12) {
        return NextResponse.json(
          { error: 'Nombre de mois invalide (1-12)' },
          { status: 400 }
        );
      }

      startDate = startOfMonth(subMonths(new Date(), monthsCount - 1));
      labels = [];
      for (let i = monthsCount - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
      }
      groupBy = 'month';
    } else {
      return NextResponse.json(
        { error: 'Période invalide' },
        { status: 400 }
      );
    }

    const endDate = endOfDay(new Date());

    // Récupérer toutes les commandes PAID de la période
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: user.establishment.id,
        status: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Grouper les données par jour ou mois
    const salesData: { [key: string]: { count: number; total: number } } = {};

    orders.forEach(order => {
      let key: string;

      if (groupBy === 'day') {
        key = order.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      } else {
        key = order.createdAt.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }

      if (!salesData[key]) {
        salesData[key] = { count: 0, total: 0 };
      }

      salesData[key].count++;
      salesData[key].total += order.totalAmount;
    });

    // Formater les données pour les graphiques
    const chartData = labels.map(label => ({
      label,
      count: salesData[label]?.count || 0,
      total: salesData[label]?.total || 0,
    }));

    // Calculer les totaux
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
      success: true,
      period,
      startDate,
      endDate,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
      },
      chartData,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
